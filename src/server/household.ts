import { notFound, redirect } from "next/navigation"
import { PlanStatus, HouseholdRole } from "@prisma/client"

import { auth } from "@/auth"
import { getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"

export async function requireUser() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  return session.user
}

export async function getActiveHouseholdContext() {
  const user = await requireUser()

  const existingMembership = await prisma.householdMember.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      household: {
        include: {
          budgetPlans: {
            where: {
              status: PlanStatus.ACTIVE,
            },
            take: 1,
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  if (existingMembership) {
    const [activePlan] = existingMembership.household.budgetPlans
    const dictionary = activePlan ? null : await getServerDictionary()
    const plan =
      activePlan ??
      (await prisma.budgetPlan.create({
        data: {
          householdId: existingMembership.householdId,
          name: dictionary!.activePlanName,
          status: PlanStatus.ACTIVE,
        },
      }))

    return {
      user,
      household: existingMembership.household,
      membership: existingMembership,
      plan,
    }
  }

  const dictionary = await getServerDictionary()
  const householdName = user.name
    ? dictionary.householdNameTemplate.replace("{name}", user.name)
    : dictionary.household

  const household = await prisma.household.create({
    data: {
      name: householdName,
      members: {
        create: {
          userId: user.id,
          role: HouseholdRole.OWNER,
        },
      },
      budgetPlans: {
        create: {
          name: dictionary.activePlanName,
          status: PlanStatus.ACTIVE,
        },
      },
    },
    include: {
      members: true,
      budgetPlans: true,
    },
  })

  return {
    user,
    household,
    membership: household.members[0],
    plan: household.budgetPlans[0],
  }
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
      commitments: true,
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
    }),
  ]).then(([deposits, commitments]) => ({
    deposits,
    commitments,
  }))
}
