import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")
const demoSource = readFileSync("src/app/demo/page.tsx", "utf8")

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

  it("uses row action menus instead of inline delete buttons", () => {
    expect(source).toContain("BudgetRowActions")
    expect(source).toContain("BudgetRowContextMenu")
    expect(source).toContain("updateDeposit")
    expect(source).toContain("updateCommitment")
    expect(source).not.toContain("DeleteButton")
  })

  it("places income above the expense chart in the left dashboard column", () => {
    expect(source.indexOf("<IncomePanel")).toBeLessThan(source.indexOf("<CommitmentChart"))
  })

  it("places expenses first below the desktop grid without changing the desktop grid", () => {
    expect(source).toContain('className="fathly-card border-destructive/35 max-lg:order-first"')
    expect(demoSource).toContain('className="fathly-card border-destructive/35 max-lg:order-first lg:row-span-2"')
  })

  it("uses green income and red expense emphasis for faster scanning", () => {
    expect(source).toContain("border-success/35")
    expect(source).toContain("text-success")
    expect(source).toContain("border-destructive/35")
    expect(source).toContain("text-destructive")
  })

  it("uses warning emphasis when the monthly result has little margin", () => {
    expect(source).toContain("getMonthlyResultTone")
    expect(source).toContain("getLowMonthlyMarginCents")
    expect(source).toContain("lowMonthlyMarginBasisPoints={data.plan.lowMonthlyMarginBasisPoints}")
    expect(source).toContain("formatLowMonthlyMarginPercent")
    expect(source).toContain("border-warning/50")
    expect(source).toContain("text-warning")
    expect(source).toContain('resultTone === "warning" &&')
    expect(source).toContain("dictionary.dashboard.monthlyResultLowMargin")
  })

  it("keeps outflow amounts and row actions aligned to the right edge", () => {
    expect(source).toContain("w-28 pr-1 text-right font-mono font-semibold")
    expect(source).toContain('TableCell className="w-9 p-0 text-right"')
  })

  it("removes extra dividers at category item edges", () => {
    expect(source).toContain("CollapsibleCategoryGroup")
    expect(source).toContain('commitmentIndex === group.commitments.length - 1 ? "border-b-0" : undefined')
  })

  it("labels category subtotals subtly in the category header rows", () => {
    expect(source).toContain("dictionary.dashboard.categoryTotal")
    expect(source).toContain("dictionary.actions.collapseCategory")
    expect(source).toContain("dictionary.actions.expandCategory")
  })

  it("sorts income rows from highest to lowest amount", () => {
    expect(source).toContain("const sortedDeposits = deposits.toSorted((a, b) => b.amountCents - a.amountCents)")
    expect(source).toContain("sortedDeposits.map")
  })

  it("uses table-like income row separators without divide artifacts", () => {
    expect(source).toContain('<CardContent className="space-y-4">')
    expect(source).toContain('<div className="space-y-1">')
    expect(demoSource).toContain('<div className="space-y-1">')
    expect(source).toContain('depositIndex === sortedDeposits.length - 1 ? "border-b-0" : "border-b border-border"')
    expect(demoSource).toContain('depositIndex === sortedDeposits.length - 1 ? "border-b-0" : "border-b border-border"')
    expect(source).not.toContain('<div className="divide-y divide-border">')
    expect(demoSource).not.toContain('<div className="divide-y divide-border">')
  })
})
