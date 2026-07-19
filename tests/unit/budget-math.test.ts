import { describe, expect, it } from "vitest"

import {
  calculateBudgetSummary,
  commitmentAmountCents,
  formatLowMonthlyMarginPercent,
  getCommitmentBreakdown,
  getLowMonthlyMarginCents,
  getMonthlyResultTone,
  groupCommitmentsByCategory,
  groupCommitmentsForTable,
  monthlyAmountCents,
} from "@/lib/budget/math"

describe("budget math", () => {
  it("normalizes annual commitments to monthly cents", () => {
    expect(monthlyAmountCents({ amountCents: 120_000, frequency: "ANNUAL" })).toBe(10_000)
    expect(monthlyAmountCents({ amountCents: 75_000, frequency: "MONTHLY" })).toBe(75_000)
  })

  it("derives itemized totals and rounds annual commitments only after summing", () => {
    const annual = {
      amountCents: null,
      amountMode: "ITEMIZED" as const,
      parts: [{ amountCents: 50 }, { amountCents: 51 }],
      frequency: "ANNUAL" as const,
    }

    expect(commitmentAmountCents(annual)).toBe(101)
    expect(monthlyAmountCents(annual)).toBe(8)
    expect(monthlyAmountCents({ ...annual, frequency: "MONTHLY" })).toBe(101)
  })

  it("calculates coverage from active deposits and commitments", () => {
    const summary = calculateBudgetSummary(
      [
        { amountCents: 180_000, status: "ACTIVE" },
        { amountCents: 180_000, status: "ACTIVE" },
        { amountCents: 50_000, status: "PAUSED" },
      ],
      [
        { amountCents: 111_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE" },
        { amountCents: 120_000, category: "Anual", frequency: "ANNUAL", status: "ACTIVE" },
        { amountCents: 20_000, category: "Fondo", frequency: "MONTHLY", status: "ACTIVE" },
      ]
    )

    expect(summary.monthlyDepositsCents).toBe(360_000)
    expect(summary.monthlyCommitmentsCents).toBe(141_000)
    expect(summary.annualProratedCents).toBe(10_000)
    expect(summary.coverageCents).toBe(219_000)
  })

  it("flags low positive monthly margin as warning", () => {
    expect(getLowMonthlyMarginCents(100_000)).toBe(5_000)
    expect(getMonthlyResultTone({ coverageCents: -1, monthlyDepositsCents: 100_000 })).toBe("shortfall")
    expect(getMonthlyResultTone({ coverageCents: 5_000, monthlyDepositsCents: 100_000 })).toBe("warning")
    expect(getMonthlyResultTone({ coverageCents: 5_001, monthlyDepositsCents: 100_000 })).toBe("surplus")
  })

  it("supports a configurable low monthly margin", () => {
    expect(getLowMonthlyMarginCents(100_000, 750)).toBe(7_500)
    expect(formatLowMonthlyMarginPercent(500)).toBe("5%")
    expect(formatLowMonthlyMarginPercent(750)).toBe("7.5%")
    expect(
      getMonthlyResultTone({
        coverageCents: 7_500,
        lowMonthlyMarginBasisPoints: 750,
        monthlyDepositsCents: 100_000,
      })
    ).toBe("warning")
    expect(
      getMonthlyResultTone({
        coverageCents: 7_501,
        lowMonthlyMarginBasisPoints: 750,
        monthlyDepositsCents: 100_000,
      })
    ).toBe("surplus")
  })

  it("groups active commitments by category", () => {
    expect(
      groupCommitmentsByCategory([
        { amountCents: 100_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE" },
        { amountCents: 120_000, category: "Casa", frequency: "ANNUAL", status: "ACTIVE" },
        { amountCents: 50_000, category: "Paused", frequency: "MONTHLY", status: "PAUSED" },
      ])
    ).toEqual({ Casa: 110_000 })
  })

  it("builds a concrete active commitment breakdown sorted by monthly impact", () => {
    expect(
      getCommitmentBreakdown([
        { amountCents: 120_000, category: "Anual", frequency: "ANNUAL", name: "Seguro", status: "ACTIVE" },
        { amountCents: 90_000, category: "Casa", frequency: "MONTHLY", name: "Hipoteca", status: "ACTIVE" },
        { amountCents: 50_000, category: "Paused", frequency: "MONTHLY", name: "Paused", status: "PAUSED" },
        { amountCents: 20_000, category: "Fondo", frequency: "MONTHLY", name: "Fondo", status: "ACTIVE" },
      ])
    ).toEqual([
      { amountCents: 90_000, category: "Casa", frequency: "MONTHLY", monthlyAmountCents: 90_000, name: "Hipoteca", status: "ACTIVE" },
      { amountCents: 20_000, category: "Fondo", frequency: "MONTHLY", monthlyAmountCents: 20_000, name: "Fondo", status: "ACTIVE" },
      { amountCents: 120_000, category: "Anual", frequency: "ANNUAL", monthlyAmountCents: 10_000, name: "Seguro", status: "ACTIVE" },
    ])
  })

  it("groups commitments for table display with category totals", () => {
    const mortgage = { amountCents: 90_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE" } as const
    const community = { amountCents: 15_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE" } as const
    const power = { amountCents: 12_000, category: "Suministros", frequency: "MONTHLY", status: "ACTIVE" } as const

    expect(groupCommitmentsForTable([mortgage, power, community])).toEqual([
      { category: "Casa", totalCents: 105_000, commitments: [mortgage, community] },
      { category: "Suministros", totalCents: 12_000, commitments: [power] },
    ])
  })
})
