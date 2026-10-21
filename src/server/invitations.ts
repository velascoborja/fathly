import { createHash, randomBytes } from "node:crypto"
import type { HouseholdInvitation } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getServerDictionary } from "@/lib/i18n/server"
import { requireHouseholdPermission } from "@/server/household"
import { serializableTransaction } from "@/server/transaction"

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function invitationState(
  invitation: Pick<HouseholdInvitation, "acceptedAt" | "cancelledAt" | "expiresAt"> | null,
  now = new Date()
) {
  if (!invitation) return "invalid" as const
  if (invitation.cancelledAt) return "cancelledLink" as const
  if (invitation.acceptedAt) return "used" as const
  if (invitation.expiresAt <= now) return "expired" as const
  return "pending" as const
}

export async function findInvitation(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return prisma.householdInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { household: { select: { name: true } } },
  })
}

export async function createInvitation(householdId: string, email: string, role: "VIEWER" | "EDITOR") {
  const { user } = await requireHouseholdPermission(householdId, "owner")
  const dictionary = await getServerDictionary()
  if (user.email?.toLowerCase() === email) throw new Error(dictionary.validation.shareAccessSelf)
  const existingMember = await prisma.householdMember.findFirst({
    where: { householdId, user: { email: { equals: email, mode: "insensitive" } } },
  })
  if (existingMember) throw new Error(dictionary.validation.shareAccessAlreadyMember)
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const data = {
    role,
    tokenHash: hashInvitationToken(token),
    createdById: user.id,
    expiresAt,
    acceptedAt: null,
    cancelledAt: null,
  }
  await prisma.householdInvitation.upsert({
    where: { householdId_email: { householdId, email } },
    create: { householdId, email, ...data },
    update: data,
  })
  return { invitationPath: `/invite/${token}`, expiresAt: expiresAt.toISOString() }
}

export async function cancelInvitation(householdId: string, invitationId: string) {
  await requireHouseholdPermission(householdId, "owner")
  await prisma.householdInvitation.updateMany({
    where: { id: invitationId, householdId, acceptedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() },
  })
}

export async function acceptInvitation(token: string, userId: string) {
  const dictionary = await getServerDictionary()
  return serializableTransaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    const invitation = /^[A-Za-z0-9_-]{43}$/.test(token)
      ? await tx.householdInvitation.findUnique({ where: { tokenHash: hashInvitationToken(token) } })
      : null
    if (!invitation || (invitation.role !== "VIEWER" && invitation.role !== "EDITOR"))
      throw new Error(dictionary.sharing.invalid)
    if (user.email?.toLowerCase() !== invitation.email) throw new Error(dictionary.sharing.wrongAccount)
    if (!user.emailVerified) throw new Error(dictionary.sharing.verify)
    const state = invitationState(invitation)
    if (state === "used") {
      const member = await tx.householdMember.findUnique({
        where: { householdId_userId: { householdId: invitation.householdId, userId } },
      })
      if (member) return invitation.householdId
    }
    if (state !== "pending") throw new Error(dictionary.sharing[state])
    const consumed = await tx.householdInvitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash: hashInvitationToken(token),
        acceptedAt: null,
        cancelledAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { acceptedAt: new Date() },
    })
    if (consumed.count !== 1) throw new Error(dictionary.sharing.invalid)
    await tx.householdMember.upsert({
      where: { householdId_userId: { householdId: invitation.householdId, userId } },
      create: { householdId: invitation.householdId, userId, role: invitation.role },
      update: {},
    })
    return invitation.householdId
  })
}
