"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/auth"
import { centsFromDecimalInput } from "@/lib/budget/format"
import { isLocale } from "@/lib/i18n/dictionaries"
import { commitmentSchema, depositSchema } from "@/lib/validations/budget"
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
  revalidatePath("/deposits")
  revalidatePath("/monthly-bills")
  revalidatePath("/annual-costs")
  revalidatePath("/savings")
}
