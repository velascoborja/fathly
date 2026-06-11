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

  it("places income above the expense chart in the left dashboard column", () => {
    expect(source.indexOf("<IncomePanel")).toBeLessThan(source.indexOf("<CommitmentChart"))
  })

  it("uses green income and red expense emphasis for faster scanning", () => {
    expect(source).toContain("border-success/35")
    expect(source).toContain("text-success")
    expect(source).toContain("border-destructive/35")
    expect(source).toContain("text-destructive")
  })

  it("sorts income rows from highest to lowest amount", () => {
    expect(source).toContain("const sortedDeposits = deposits.toSorted((a, b) => b.amountCents - a.amountCents)")
    expect(source).toContain("sortedDeposits.map")
  })
})
