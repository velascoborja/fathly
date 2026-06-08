import { describe, expect, it } from "vitest"

import { calculateBudgetSummary, groupCommitmentsByCategory, monthlyAmountCents } from "@/lib/budget/math"

describe("budget math", () => {
  it("normalizes annual commitments to monthly cents", () => {
    expect(monthlyAmountCents({ amountCents: 120_000, frequency: "ANNUAL" })).toBe(10_000)
    expect(monthlyAmountCents({ amountCents: 75_000, frequency: "MONTHLY" })).toBe(75_000)
  })

  it("calculates coverage from active deposits and commitments", () => {
    const summary = calculateBudgetSummary(
      [
        { amountCents: 180_000, status: "ACTIVE" },
        { amountCents: 180_000, status: "ACTIVE" },
        { amountCents: 50_000, status: "PAUSED" },
      ],
      [
        { amountCents: 111_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE", type: "BILL" },
        { amountCents: 120_000, category: "Anual", frequency: "ANNUAL", status: "ACTIVE", type: "BILL" },
        { amountCents: 20_000, category: "Ahorro", frequency: "MONTHLY", status: "ACTIVE", type: "SAVINGS" },
      ]
    )

    expect(summary.monthlyDepositsCents).toBe(360_000)
    expect(summary.monthlyCommitmentsCents).toBe(141_000)
    expect(summary.annualProratedCents).toBe(10_000)
    expect(summary.savingsCents).toBe(20_000)
    expect(summary.coverageCents).toBe(219_000)
  })

  it("groups active commitments by category", () => {
    expect(
      groupCommitmentsByCategory([
        { amountCents: 100_000, category: "Casa", frequency: "MONTHLY", status: "ACTIVE", type: "BILL" },
        { amountCents: 120_000, category: "Casa", frequency: "ANNUAL", status: "ACTIVE", type: "BILL" },
        { amountCents: 50_000, category: "Paused", frequency: "MONTHLY", status: "PAUSED", type: "BILL" },
      ])
    ).toEqual({ Casa: 110_000 })
  })
})
