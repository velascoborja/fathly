import { redirect } from "next/navigation"
import { PlanStatus, HouseholdRole } from "@prisma/client"

import { auth } from "@/auth"
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
    const plan =
      activePlan ??
      (await prisma.budgetPlan.create({
        data: {
          householdId: existingMembership.householdId,
          name: "Current plan",
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

  const householdName = user.name ? `${user.name}'s household` : "Casa familiar"

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
          name: "Current plan",
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

  const [deposits, commitments] = await Promise.all([
    prisma.deposit.findMany({
      where: {
        householdId: context.household.id,
        planId: context.plan.id,
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
        householdId: context.household.id,
        planId: context.plan.id,
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
  ])

  return {
    ...context,
    deposits,
    commitments,
  }
}
