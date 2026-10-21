"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"
import { getHouseholdInviteSchema } from "@/lib/validations/household"
import { requireUser, requireHouseholdPermission, setActiveHousehold } from "@/server/household"
import { acceptInvitation, cancelInvitation, createInvitation } from "@/server/invitations"

export type InvitationResult =
  | { invitationPath: string; expiresAt: string; error?: never }
  | { error: string; invitationPath?: never; expiresAt?: never }

function publicError(error: unknown, dictionary: Awaited<ReturnType<typeof getServerDictionary>>) {
  const messages: string[] = [
    ...Object.values(dictionary.sharing).filter((value): value is string => typeof value === "string"),
    dictionary.validation.shareAccessSelf,
    dictionary.validation.shareAccessAlreadyMember,
  ]
  if (error instanceof Error && messages.includes(error.message)) return error.message
  console.error("Household invitation operation failed", error)
  return dictionary.sharing.operationError
}

export async function createHouseholdInvitation(householdId: string, formData: FormData): Promise<InvitationResult> {
  const dictionary = await getServerDictionary()
  const parsed = getHouseholdInviteSchema(dictionary.validation).safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  try {
    const result = await createInvitation(householdId, parsed.data.email, parsed.data.role)
    revalidatePath("/settings")
    return result
  } catch (error) {
    return { error: publicError(error, dictionary) }
  }
}

export async function regenerateHouseholdInvitation(
  householdId: string,
  invitationId: string
): Promise<InvitationResult> {
  const dictionary = await getServerDictionary()
  try {
    await requireHouseholdPermission(householdId, "owner")
    const invitation = await prisma.householdInvitation.findFirst({
      where: { id: invitationId, householdId, acceptedAt: null, cancelledAt: null },
    })
    if (!invitation || (invitation.role !== "VIEWER" && invitation.role !== "EDITOR"))
      return { error: dictionary.sharing.invalid }
    const result = await createInvitation(householdId, invitation.email, invitation.role)
    revalidatePath("/settings")
    return result
  } catch (error) {
    return { error: publicError(error, dictionary) }
  }
}

export async function cancelHouseholdInvitation(householdId: string, invitationId: string) {
  const dictionary = await getServerDictionary()
  try {
    await cancelInvitation(householdId, invitationId)
    revalidatePath("/settings")
    return { error: null }
  } catch (error) {
    return { error: publicError(error, dictionary) }
  }
}

export async function acceptHouseholdInvitation(token: string) {
  const user = await requireUser(`/invite/${token}`)
  const dictionary = await getServerDictionary()
  let householdId: string
  try {
    householdId = await acceptInvitation(token, user.id)
  } catch (error) {
    return { error: publicError(error, dictionary) }
  }
  await setActiveHousehold(householdId)
  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function switchHousehold(householdId: string) {
  const user = await requireUser()
  const dictionary = await getServerDictionary()
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: user.id } },
  })
  if (!member) return { error: dictionary.sharing.noAccess }
  await setActiveHousehold(householdId)
  revalidatePath("/", "layout")
  redirect("/dashboard")
}
