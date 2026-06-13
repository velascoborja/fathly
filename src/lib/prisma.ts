import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

import { normalizeDatabaseUrl } from "@/lib/database-url"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const connectionString = normalizeDatabaseUrl(
  process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/fathly?schema=public"
)

const adapter = new PrismaPg({
  connectionString,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
