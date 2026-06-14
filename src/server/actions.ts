"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { HouseholdRole } from "@prisma/client"

import { signIn, signOut } from "@/auth"
import { centsFromDecimalInput } from "@/lib/budget/format"
import { inferCommitmentIcon } from "@/lib/budget/commitment-icons"
import { isLocale } from "@/lib/i18n/dictionaries"
import { commitmentSchema, depositSchema, planSettingsSchema } from "@/lib/validations/budget"
import { householdInviteSchema, householdNameSchema } from "@/lib/validations/household"
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
  const parsed = householdNameSchema.safeParse(formData.get("name"))

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid household name.")
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
  const parsed = householdInviteSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid email.")
  }

  const context = await getActiveHouseholdContext()

  if (context.membership.role !== "OWNER") {
    throw new Error("Only household owners can share access.")
  }

  if (context.user.email?.toLowerCase() === parsed.data.email) {
    throw new Error("You already have access to this household.")
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
    throw new Error("That email does not belong to a Fathly user yet.")
  }

  const existingMembership = user.memberships.find(
    (membership) => membership.householdId === context.household.id
  )

  if (existingMembership) {
    throw new Error("That user already has access to this household.")
  }

  if (user.memberships.length > 0) {
    throw new Error("That user already belongs to another household. Household switching is not supported yet.")
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
  const parsed = planSettingsSchema.safeParse({
    lowMonthlyMarginPercent: formData.get("lowMonthlyMarginPercent"),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid plan settings.")
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

export async function createDeposit(formData: FormData) {
  const parsed = depositSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid deposit.")
  }

  const context = await getActiveHouseholdContext()

  await prisma.deposit.create({
    data: {
      householdId: context.household.id,
      planId: context.plan.id,
      name: parsed.data.name,
      amountCents: centsFromDecimalInput(parsed.data.amount),
      notes: parsed.data.notes,
    },
  })

  revalidateBudgetPaths()
}

export async function updateDeposit(id: string, formData: FormData) {
  const parsed = depositSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid deposit.")
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
  const parsed = commitmentSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    icon: formData.get("icon") || inferCommitmentIcon(String(formData.get("name") ?? "")),
    frequency: formData.get("frequency"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid commitment.")
  }

  const context = await getActiveHouseholdContext()

  await prisma.commitment.create({
    data: {
      householdId: context.household.id,
      planId: context.plan.id,
      name: parsed.data.name,
      amountCents: centsFromDecimalInput(parsed.data.amount),
      category: parsed.data.category,
      icon: parsed.data.icon,
      frequency: parsed.data.frequency,
      type: parsed.data.type,
      notes: parsed.data.notes,
    },
  })

  revalidateBudgetPaths()
}

export async function updateCommitment(id: string, formData: FormData) {
  const parsed = commitmentSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    icon: formData.get("icon") || inferCommitmentIcon(String(formData.get("name") ?? "")),
    frequency: formData.get("frequency"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid commitment.")
  }

  const context = await getActiveHouseholdContext()

  await prisma.commitment.update({
    where: {
      id,
      householdId: context.household.id,
      planId: context.plan.id,
    },
    data: {
      name: parsed.data.name,
      amountCents: centsFromDecimalInput(parsed.data.amount),
      category: parsed.data.category,
      icon: parsed.data.icon,
      frequency: parsed.data.frequency,
      type: parsed.data.type,
      notes: parsed.data.notes,
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

function revalidateBudgetPaths() {
  revalidatePath("/dashboard")
}
