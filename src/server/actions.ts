"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { HouseholdRole, PlanStatus } from "@prisma/client"

import { signIn, signOut } from "@/auth"
import { centsFromDecimalInput } from "@/lib/budget/format"
import { inferCommitmentIcon } from "@/lib/budget/commitment-icons"
import { inferDepositIcon } from "@/lib/budget/deposit-icons"
import { isLocale } from "@/lib/i18n/dictionaries"
import { getServerDictionary } from "@/lib/i18n/server"
import {
  getCategoryNameSchema,
  getCheckpointSchema,
  getCommitmentSchema,
  getDepositSchema,
  getInitialSetupSchema,
  getPlanSettingsSchema,
  type CommitmentInput,
} from "@/lib/validations/budget"
import { getHouseholdInviteSchema, getHouseholdNameSchema } from "@/lib/validations/household"
import { prisma } from "@/lib/prisma"
import { getActiveHouseholdContext } from "@/server/household"

export async function signInWithGoogle() {
  await signIn("google", {
    redirectTo: "/dashboard",
  })
}

export async function signOutUser() {
  await signOut({
    redirectTo: "/auth/signin",
  })
}

export async function deleteUserAccount() {
  const context = await getActiveHouseholdContext()
  const userId = context.user.id

  await prisma.$transaction(async (tx) => {
    const memberships = await tx.householdMember.findMany({
      where: {
        userId,
      },
      select: {
        householdId: true,
        role: true,
      },
    })

    for (const membership of memberships) {
      const remainingMembers = await tx.householdMember.findMany({
        where: {
          householdId: membership.householdId,
          userId: {
            not: userId,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          role: true,
        },
      })

      if (remainingMembers.length === 0) {
        await tx.household.delete({
          where: {
            id: membership.householdId,
          },
        })
        continue
      }

      const householdKeepsOwner = remainingMembers.some((member) => member.role === HouseholdRole.OWNER)

      if (membership.role === HouseholdRole.OWNER && !householdKeepsOwner) {
        await tx.householdMember.update({
          where: {
            id: remainingMembers[0].id,
          },
          data: {
            role: HouseholdRole.OWNER,
          },
        })
      }
    }

    await tx.user.delete({
      where: {
        id: userId,
      },
    })
  })

  await signOut({
    redirectTo: "/auth/signin",
  })
}

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) {
    return
  }

  const cookieStore = await cookies()
  cookieStore.set("fathly-locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })

  revalidatePath("/", "layout")
}

export async function updateHouseholdName(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getHouseholdNameSchema(dictionary.validation).safeParse(formData.get("name"))

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericHouseholdNameInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.household.update({
    where: {
      id: context.household.id,
    },
    data: {
      name: parsed.data,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/", "layout")
}

export async function shareHouseholdAccess(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getHouseholdInviteSchema(dictionary.validation).safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericEmailInvalid)
  }

  const context = await getActiveHouseholdContext()

  if (context.membership.role !== "OWNER") {
    throw new Error(dictionary.validation.shareAccessOwnerOnly)
  }

  if (context.user.email?.toLowerCase() === parsed.data.email) {
    return
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: parsed.data.email,
        mode: "insensitive",
      },
    },
    include: {
      memberships: {
        select: {
          householdId: true,
        },
      },
    },
  })

  if (!user) {
    return
  }

  const existingMembership = user.memberships.find(
    (membership) => membership.householdId === context.household.id
  )

  if (existingMembership) {
    return
  }

  if (user.memberships.length > 0) {
    return
  }

  await prisma.householdMember.create({
    data: {
      householdId: context.household.id,
      userId: user.id,
      role: HouseholdRole.MEMBER,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/", "layout")
}

export async function updatePlanSettings(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getPlanSettingsSchema(dictionary.validation).safeParse({
    lowMonthlyMarginPercent: formData.get("lowMonthlyMarginPercent"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericPlanSettingsInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.budgetPlan.update({
    where: {
      id: context.plan.id,
      householdId: context.household.id,
    },
    data: {
      lowMonthlyMarginBasisPoints: Math.round(parsed.data.lowMonthlyMarginPercent * 100),
    },
  })

  revalidatePath("/settings")
  revalidateBudgetPaths()
}

export async function createCheckpoint(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getCheckpointSchema(dictionary.validation).safeParse({
    name: formData.get("name"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericCheckpointInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.$transaction(async (tx) => {
    const [deposits, commitments] = await Promise.all([
      tx.deposit.findMany({
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
      tx.commitment.findMany({
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
        include: {
          parts: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
    ])

    const checkpoint = await tx.budgetPlan.create({
      data: {
        householdId: context.household.id,
        name: parsed.data.name,
        status: PlanStatus.ARCHIVED,
        lowMonthlyMarginBasisPoints: context.plan.lowMonthlyMarginBasisPoints,
        onboardingCompletedAt: context.plan.onboardingCompletedAt,
        startsOn: context.plan.startsOn,
        endsOn: context.plan.endsOn,
      },
    })

    if (deposits.length > 0) {
      await tx.deposit.createMany({
        data: deposits.map((deposit) => ({
          householdId: context.household.id,
          planId: checkpoint.id,
          name: deposit.name,
          amountCents: deposit.amountCents,
          icon: deposit.icon,
          status: deposit.status,
          notes: deposit.notes,
          sortOrder: deposit.sortOrder,
        })),
      })
    }

    if (commitments.length > 0) {
      await Promise.all(
        commitments.map((commitment) => tx.commitment.create({
          data: {
          householdId: context.household.id,
          planId: checkpoint.id,
          name: commitment.name,
          category: commitment.category,
          icon: commitment.icon,
          type: commitment.type,
          frequency: commitment.frequency,
          amountMode: commitment.amountMode,
          amountCents: commitment.amountCents,
          status: commitment.status,
          notes: commitment.notes,
          sortOrder: commitment.sortOrder,
          parts: commitment.parts.length > 0 ? {
            create: commitment.parts.map((part) => ({
              name: part.name,
              amountCents: part.amountCents,
              sortOrder: part.sortOrder,
            })),
          } : undefined,
          },
        }))
      )
    }
  })

  revalidateBudgetPaths()
  revalidatePath("/checkpoints")
}

export async function deleteCheckpoint(id: string) {
  const context = await getActiveHouseholdContext()

  await prisma.budgetPlan.delete({
    where: {
      id,
      householdId: context.household.id,
      status: PlanStatus.ARCHIVED,
    },
  })

  revalidatePath("/checkpoints")
}

export async function createDeposit(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getDepositSchema(dictionary.validation).safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    icon: formData.get("icon") || inferDepositIcon(String(formData.get("name") ?? "")),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericDepositInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.deposit.create({
    data: {
      householdId: context.household.id,
      planId: context.plan.id,
      name: parsed.data.name,
      amountCents: centsFromDecimalInput(parsed.data.amount),
      icon: parsed.data.icon,
      notes: parsed.data.notes,
    },
  })

  revalidateBudgetPaths()
}

export async function completeInitialSetup(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getInitialSetupSchema(dictionary.validation).safeParse({
    deposits: parseSetupItems(formData, "deposit"),
    monthlyBills: parseSetupItems(formData, "monthlyBill"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericSetupInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.$transaction(async (tx) => {
    const nextDepositSortOrder = await tx.deposit.count({
      where: {
        householdId: context.household.id,
        planId: context.plan.id,
      },
    })
    const nextCommitmentSortOrder = await tx.commitment.count({
      where: {
        householdId: context.household.id,
        planId: context.plan.id,
      },
    })

    if (parsed.data.deposits.length > 0) {
      await tx.deposit.createMany({
        data: parsed.data.deposits.map((deposit, index) => ({
          householdId: context.household.id,
          planId: context.plan.id,
          name: deposit.name,
          amountCents: centsFromDecimalInput(deposit.amount),
          icon: inferDepositIcon(deposit.name),
          sortOrder: nextDepositSortOrder + index,
        })),
      })
    }

    const commitments = parsed.data.monthlyBills.map((bill, index) => ({
      category: dictionary.setup.defaultCategories.monthlyBills,
      frequency: "MONTHLY" as const,
      icon: inferCommitmentIcon(bill.name),
      name: bill.name,
      amountCents: centsFromDecimalInput(bill.amount),
      sortOrder: nextCommitmentSortOrder + index,
      type: "BILL" as const,
    }))

    if (commitments.length > 0) {
      await tx.commitment.createMany({
        data: commitments.map((commitment) => ({
          householdId: context.household.id,
          planId: context.plan.id,
          ...commitment,
        })),
      })
    }

    await tx.budgetPlan.update({
      where: {
        id: context.plan.id,
        householdId: context.household.id,
      },
      data: {
        onboardingCompletedAt: new Date(),
      },
    })
  })

  revalidateBudgetPaths()
  revalidatePath("/setup")
}

export async function updateDeposit(id: string, formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getDepositSchema(dictionary.validation).safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    icon: formData.get("icon") || inferDepositIcon(String(formData.get("name") ?? "")),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericDepositInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.deposit.update({
    where: {
      id,
      householdId: context.household.id,
      planId: context.plan.id,
    },
    data: {
      name: parsed.data.name,
      amountCents: centsFromDecimalInput(parsed.data.amount),
      icon: parsed.data.icon,
      notes: parsed.data.notes,
    },
  })

  revalidateBudgetPaths()
}

export async function deleteDeposit(id: string) {
  const context = await getActiveHouseholdContext()

  await prisma.deposit.delete({
    where: {
      id,
      householdId: context.household.id,
      planId: context.plan.id,
    },
  })

  revalidateBudgetPaths()
}

export async function createCommitment(formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getCommitmentSchema(dictionary.validation).safeParse(parseCommitmentFormData(formData))

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericCommitmentInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.$transaction(async (tx) => {
    await tx.commitment.create({
      data: {
        householdId: context.household.id,
        planId: context.plan.id,
        ...getCommitmentMutationData(parsed.data),
      },
    })
  })

  revalidateBudgetPaths()
}

export async function updateCommitment(id: string, formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getCommitmentSchema(dictionary.validation).safeParse(parseCommitmentFormData(formData))

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericCommitmentInvalid)
  }

  const context = await getActiveHouseholdContext()

  await prisma.$transaction(async (tx) => {
    await tx.commitment.update({
      where: {
        id,
        householdId: context.household.id,
        planId: context.plan.id,
      },
      data: {
        ...getCommitmentMutationData(parsed.data),
        parts: {
          deleteMany: {},
          ...(parsed.data.amountMode === "ITEMIZED" ? {
            create: parsed.data.parts.map((part, index) => ({
              name: part.name,
              amountCents: centsFromDecimalInput(part.amount),
              sortOrder: index,
            })),
          } : {}),
        },
      },
    })
  })

  revalidateBudgetPaths()
}

export async function renameCommitmentCategory(oldCategory: string, formData: FormData) {
  const dictionary = await getServerDictionary()
  const parsed = getCategoryNameSchema(dictionary.validation).safeParse(formData.get("category"))

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? dictionary.validation.genericCommitmentInvalid)
  }

  const nextCategory = parsed.data
  const currentCategory = oldCategory.trim()

  if (nextCategory === currentCategory) {
    throw new Error(dictionary.validation.categoryUnchanged)
  }

  const context = await getActiveHouseholdContext()
  const categoryExists = await prisma.commitment.findFirst({
    where: {
      householdId: context.household.id,
      planId: context.plan.id,
      category: {
        equals: nextCategory,
        mode: "insensitive",
      },
      NOT: {
        category: currentCategory,
      },
    },
    select: {
      id: true,
    },
  })

  if (categoryExists) {
    throw new Error(dictionary.validation.categoryDuplicate)
  }

  await prisma.commitment.updateMany({
    where: {
      householdId: context.household.id,
      planId: context.plan.id,
      category: currentCategory,
    },
    data: {
      category: nextCategory,
    },
  })

  revalidateBudgetPaths()
}

export async function deleteCommitment(id: string) {
  const context = await getActiveHouseholdContext()

  await prisma.commitment.delete({
    where: {
      id,
      householdId: context.household.id,
      planId: context.plan.id,
    },
  })

  revalidateBudgetPaths()
}

export async function goToDashboard() {
  redirect("/dashboard")
}

function parseSetupItems(formData: FormData, prefix: string) {
  const names = formData.getAll(`${prefix}Name`)
  const amounts = formData.getAll(`${prefix}Amount`)
  const itemCount = Math.max(names.length, amounts.length)

  return Array.from({ length: itemCount }, (_, index) => ({
    name: String(names[index] ?? ""),
    amount: String(amounts[index] ?? ""),
  }))
}

function parseCommitmentFormData(formData: FormData) {
  const amountMode = formData.get("amountMode") === "ITEMIZED" ? "ITEMIZED" : "FIXED"
  let parts: unknown = []

  try {
    parts = JSON.parse(String(formData.get("parts") ?? "[]"))
  } catch {
    parts = []
  }

  return {
    name: formData.get("name"),
    amountMode,
    ...(amountMode === "FIXED" ? { amount: formData.get("amount") } : { parts }),
    category: formData.get("category"),
    icon: formData.get("icon") || inferCommitmentIcon(String(formData.get("name") ?? "")),
    frequency: formData.get("frequency"),
    type: "BILL",
    notes: formData.get("notes") || undefined,
  }
}

function getCommitmentMutationData(
  input: CommitmentInput
) {
  const common = {
    name: input.name,
    amountMode: input.amountMode,
    amountCents: input.amountMode === "FIXED" ? centsFromDecimalInput(input.amount) : null,
    category: input.category,
    icon: input.icon,
    frequency: input.frequency,
    type: input.type,
    notes: input.notes,
  }

  return input.amountMode === "ITEMIZED"
    ? {
        ...common,
        parts: {
          create: input.parts.map((part, index) => ({
            name: part.name,
            amountCents: centsFromDecimalInput(part.amount),
            sortOrder: index,
          })),
        },
      }
    : common
}

function revalidateBudgetPaths() {
  revalidatePath("/dashboard")
}
