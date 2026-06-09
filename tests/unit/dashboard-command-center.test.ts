import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

describe("dashboard command center", () => {
  it("renders all budget management surfaces on the dashboard", () => {
    expect(source).toContain("BudgetCommandPanel")
    expect(source).toContain("BudgetDataSection")
    expect(source).toContain("dictionary.nav.deposits")
    expect(source).toContain("dictionary.nav.monthlyBills")
    expect(source).toContain("dictionary.nav.annualCosts")
    expect(source).toContain("dictionary.nav.savings")
    expect(source).toContain("HouseholdNameForm")
    expect(source).toContain("CommitmentChart")
  })
})
