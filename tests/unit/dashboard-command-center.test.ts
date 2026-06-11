import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

describe("dashboard monthly overview", () => {
  it("removes the command center and renders focused budget surfaces", () => {
    expect(source).not.toContain("BudgetCommandPanel")
    expect(source).not.toContain("dictionary.dashboard.commandCenter")
    expect(source).toContain("MonthlySnapshot")
    expect(source).toContain("IncomePanel")
    expect(source).toContain("OutflowTable")
    expect(source).toContain("dictionary.nav.deposits")
    expect(source).not.toContain("HouseholdNameForm")
    expect(source).toContain("CommitmentChart")
    expect(source).toContain("getCommitmentBreakdown")
  })
})
