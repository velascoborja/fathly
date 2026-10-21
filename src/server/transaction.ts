import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

function isTransactionConflict(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  return (
    error.code === "P2034" || (error.code === "P2010" && (error.meta?.code === "40001" || error.meta?.code === "40P01"))
  )
}

export async function serializableTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (attempt >= 4 || !isTransactionConflict(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, 10 * 2 ** attempt))
    }
  }
}
