import { notFound, redirect } from "next/navigation"
import { PlanStatus, HouseholdRole } from "@prisma/client"
import { cache } from "react"
import { cookies } from "next/headers"

import { canEditBudget, safeReturnTo, selectHousehold } from "@/lib/household-access"

import { auth } from "@/auth"
import { getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"

export const requireUser = cache(async function requireUser(returnTo?: string) {
  const session = await auth()

  if (!session?.user?.id) {
    const destination = safeReturnTo(returnTo)
    redirect(destination === "/dashboard" ? "/auth/signin" : `/auth/signin?callbackUrl=${encodeURIComponent(destination)}`)
  }

  return session.user
})

const membershipInclude = {
  household: {
    include: {
      budgetPlans: {
        where: { status: PlanStatus.ACTIVE },
        take: 1,
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
}

export const getHouseholdMemberships = cache(async function getHouseholdMemberships() {
  const user = await requireUser()
  return prisma.householdMember.findMany({
    where: { userId: user.id },
    include: membershipInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  })
})

async function membershipContext(membership: Awaited<ReturnType<typeof getHouseholdMemberships>>[number]) {
  const user = await requireUser()
  let plan = membership.household.budgetPlans[0]
  if (!plan) {
    if (!canEditBudget(membership.role)) notFound()
    const dictionary = await getServerDictionary()
    plan = await prisma.budgetPlan.create({
      data: { householdId: membership.householdId, name: dictionary.activePlanName, status: PlanStatus.ACTIVE },
    })
  }
  return { user, membership, household: membership.household, plan }
}

export const getActiveHouseholdContext = cache(async function getActiveHouseholdContext() {
  const user = await requireUser()
  const memberships = await getHouseholdMemberships()
  const selectedId = (await cookies()).get("fathly-household")?.value
  const selected = selectHousehold(memberships, selectedId)
  if (selected) return { ...await membershipContext(selected), memberships }

  const dictionary = await getServerDictionary()
  const householdName = user.name
    ? dictionary.householdNameTemplate.replace("{name}", user.name)
    : dictionary.household

  // Serialize first visits across requests, including concurrent invitation acceptance.
  const membership = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`
    const existing = await tx.householdMember.findFirst({
      where: { userId: user.id }, include: membershipInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })
    if (existing) return existing
    const household = await tx.household.create({
      data: {
        name: householdName,
        members: { create: { userId: user.id, role: HouseholdRole.OWNER } },
        budgetPlans: { create: { name: dictionary.activePlanName, status: PlanStatus.ACTIVE } },
      },
    })
    return tx.householdMember.findUniqueOrThrow({
      where: { householdId_userId: { householdId: household.id, userId: user.id } }, include: membershipInclude,
    })
  })
  return { ...await membershipContext(membership), memberships: [membership] }
})

export async function requireHouseholdPermission(householdId: string, permission: "edit" | "owner") {
  const user = await requireUser()
  const dictionary = await getServerDictionary()
  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: user.id } },
    include: membershipInclude,
  })
  if (!membership) throw new Error(dictionary.sharing.noAccess)
  if (permission === "owner" ? membership.role !== "OWNER" : !canEditBudget(membership.role)) {
    throw new Error(permission === "owner" ? dictionary.sharing.ownerOnly : dictionary.sharing.forbidden)
  }
  return membershipContext(membership)
}

export async function setActiveHousehold(householdId: string) {
  const cookieStore = await cookies()
  cookieStore.set("fathly-household", householdId, {
    path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function getBudgetData() {
  const context = await getActiveHouseholdContext()

  const { deposits, commitments } = await getBudgetItems(context.household.id, context.plan.id)

  return {
    ...context,
    deposits,
    commitments,
  }
}

export async function getCheckpoints() {
  const context = await getActiveHouseholdContext()

  const checkpoints = await prisma.budgetPlan.findMany({
    where: {
      householdId: context.household.id,
      status: PlanStatus.ARCHIVED,
    },
    include: {
      deposits: true,
      commitments: {
        include: {
          parts: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return {
    ...context,
    checkpoints,
  }
}

export async function getCheckpointData(checkpointId: string) {
  const context = await getActiveHouseholdContext()

  const [checkpoint, activeItems] = await Promise.all([
    prisma.budgetPlan.findFirst({
      where: {
        id: checkpointId,
        householdId: context.household.id,
        status: PlanStatus.ARCHIVED,
      },
      include: {
        deposits: {
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
        commitments: {
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
          include: {
            parts: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    }),
    getBudgetItems(context.household.id, context.plan.id),
  ])

  if (!checkpoint) {
    notFound()
  }

  return {
    ...context,
    activeDeposits: activeItems.deposits,
    activeCommitments: activeItems.commitments,
    checkpoint,
  }
}

function getBudgetItems(householdId: string, planId: string) {
  return Promise.all([
    prisma.deposit.findMany({
      where: {
        householdId,
        planId,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    }),
    prisma.commitment.findMany({
      where: {
        householdId,
        planId,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      include: {
        parts: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
  ]).then(([deposits, commitments]) => ({
    deposits,
    commitments,
  }))
}
