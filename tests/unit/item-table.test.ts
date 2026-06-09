import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import type { Commitment } from "@prisma/client"
import { describe, expect, it } from "vitest"

import { CommitmentTable } from "@/components/budget/item-table"
import { dictionaries } from "@/lib/i18n/dictionaries"

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  const now = new Date("2026-01-01T00:00:00.000Z")

  return {
    id: "commitment-1",
    householdId: "household-1",
    planId: "plan-1",
    name: "Internet",
    category: "Casa",
    type: "BILL",
    frequency: "MONTHLY",
    amountCents: 4_000,
    status: "ACTIVE",
    notes: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe("CommitmentTable", () => {
  it("can hide the frequency column for pages that already imply frequency", () => {
    const html = renderToStaticMarkup(
      createElement(CommitmentTable, {
        commitments: [commitment()],
        dictionary: dictionaries.es,
        groupByCategory: true,
        hideFrequency: true,
        locale: "es",
        onDelete: async () => {},
        title: dictionaries.es.nav.monthlyBills,
      })
    )

    expect(html).not.toContain(dictionaries.es.forms.frequency)
    expect(html).not.toContain(dictionaries.es.forms.monthly)
    expect(html).toContain("Internet")
    expect(html).toContain("Casa")
  })

  it("can replace frequency with a prorated amount column for annual costs", () => {
    const html = renderToStaticMarkup(
      createElement(CommitmentTable, {
        commitments: [commitment({ amountCents: 120_000, frequency: "ANNUAL" })],
        dictionary: dictionaries.es,
        hideFrequency: true,
        locale: "es",
        onDelete: async () => {},
        showProratedAmount: true,
        title: dictionaries.es.nav.annualCosts,
      })
    )

    expect(html).toContain(dictionaries.es.forms.prorated)
    expect(html).not.toContain(dictionaries.es.forms.frequency)
    expect(html).not.toContain(dictionaries.es.forms.annual)
    expect(html).toContain("1200")
    expect(html).toContain("100")
  })
})
