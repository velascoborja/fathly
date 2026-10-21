import { loadEnvConfig } from "@next/env"
import { Prisma } from "@prisma/client"
import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

loadEnvConfig(process.cwd())

type EmptyDuplicate = {
  id: string
  keepId: string
  backup: Prisma.JsonObject
}

// Restrict repairs to untouched households from the legacy first-visit race.
const emptyDuplicates = Prisma.sql`
  SELECT h.id, original.id AS "keepId",
    json_build_object(
      'household', row_to_json(h),
      'members', (SELECT json_agg(m) FROM "HouseholdMember" m WHERE m."householdId" = h.id),
      'budgetPlans', (SELECT json_agg(p) FROM "BudgetPlan" p WHERE p."householdId" = h.id)
    ) AS backup
  FROM "Household" h
  JOIN "HouseholdMember" owner ON owner."householdId" = h.id AND owner.role = 'OWNER'
  JOIN LATERAL (
    SELECT earlier.id
    FROM "Household" earlier
    JOIN "HouseholdMember" member ON member."householdId" = earlier.id
    WHERE member."userId" = owner."userId" AND member.role = 'OWNER'
      AND earlier.name = h.name
      AND (earlier."createdAt", earlier.id) < (h."createdAt", h.id)
      AND h."createdAt" - earlier."createdAt" <= interval '1 second'
    ORDER BY earlier."createdAt", earlier.id LIMIT 1
  ) original ON true
  WHERE h."createdAt" < timestamp '2026-10-21 12:00:00'
    AND (SELECT count(*) FROM "HouseholdMember" m WHERE m."householdId" = h.id) = 1
    AND NOT EXISTS (SELECT 1 FROM "Deposit" d WHERE d."householdId" = h.id)
    AND NOT EXISTS (SELECT 1 FROM "Commitment" c WHERE c."householdId" = h.id)
    AND NOT EXISTS (SELECT 1 FROM "HouseholdInvitation" i WHERE i."householdId" = h.id)
    AND (SELECT count(*) FROM "BudgetPlan" p WHERE p."householdId" = h.id) = 1
    AND EXISTS (
      SELECT 1 FROM "BudgetPlan" p WHERE p."householdId" = h.id
        AND p.status = 'ACTIVE' AND p."onboardingCompletedAt" IS NULL
        AND p."startsOn" IS NULL AND p."endsOn" IS NULL
        AND p."lowMonthlyMarginBasisPoints" = 500 AND p."updatedAt" = p."createdAt"
        AND NOT EXISTS (SELECT 1 FROM "Deposit" d WHERE d."planId" = p.id)
        AND NOT EXISTS (SELECT 1 FROM "Commitment" c WHERE c."planId" = p.id)
    )
  ORDER BY h."createdAt", h.id
`

async function main() {
  const { prisma } = await import("../src/lib/prisma")
  try {
    if (!process.argv.includes("--apply")) {
      const duplicates = await prisma.$queryRaw<EmptyDuplicate[]>(emptyDuplicates)
      console.table(duplicates.map(({ id, keepId }) => ({ emptyDuplicate: id, keep: keepId })))
      console.log(`${duplicates.length} untouched duplicates found. Dry run; no changes made.`)
      return
    }

    await prisma.$transaction(
      async (tx) => {
        // Recheck under table locks so a simultaneous budget write cannot be lost.
        await tx.$executeRaw`LOCK TABLE "Household", "HouseholdMember", "BudgetPlan", "Deposit", "Commitment", "HouseholdInvitation" IN SHARE ROW EXCLUSIVE MODE`
        const duplicates = await tx.$queryRaw<EmptyDuplicate[]>(emptyDuplicates)
        if (!duplicates.length) {
          console.log("No untouched duplicates to repair.")
          return
        }
        const backupPath = join(tmpdir(), `fathly-household-repair-${Date.now()}.json`)
        await writeFile(backupPath, JSON.stringify(duplicates, null, 2), { flag: "wx", mode: 0o600 })
        const removed = await tx.household.deleteMany({ where: { id: { in: duplicates.map(({ id }) => id) } } })
        console.log(`Removed ${removed.count} empty duplicates. Recovery backup: ${backupPath}`)
      },
      { timeout: 15_000 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
