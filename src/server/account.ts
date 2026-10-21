import { getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/server/household"
import { serializableTransaction } from "@/server/transaction"

export async function getOwnershipTransfers() {
  const user = await requireUser()
  const memberships = await prisma.householdMember.findMany({
    where: { userId: user.id, role: "OWNER" },
    include: { household: { include: { members: { include: { user: { select: { name: true, email: true } } } } } } },
  })
  return memberships.flatMap(({ household }) => {
    const remaining = household.members.filter((member) => member.userId !== user.id)
    return remaining.length && !remaining.some((member) => member.role === "OWNER")
      ? [
          {
            householdId: household.id,
            name: household.name,
            members: remaining.map((member) => ({
              id: member.id,
              name: member.user.name ?? member.user.email ?? member.id,
            })),
          },
        ]
      : []
  })
}

export async function deleteAccountData(userId: string, successors: Record<string, string>) {
  const dictionary = await getServerDictionary()
  await serializableTransaction(async (tx) => {
    const memberships = await tx.householdMember.findMany({ where: { userId } })
    for (const membership of memberships) {
      const remaining = await tx.householdMember.findMany({
        where: { householdId: membership.householdId, userId: { not: userId } },
      })
      if (!remaining.length) {
        await tx.household.delete({ where: { id: membership.householdId } })
      } else if (membership.role === "OWNER" && !remaining.some((member) => member.role === "OWNER")) {
        const successorId =
          successors && typeof successors === "object" ? successors[membership.householdId] : undefined
        const successor = remaining.find((member) => member.id === successorId)
        if (!successor) throw new Error(dictionary.sharing.successorRequired)
        await tx.householdMember.update({ where: { id: successor.id }, data: { role: "OWNER" } })
      }
    }
    await tx.user.delete({ where: { id: userId } })
  })
}
