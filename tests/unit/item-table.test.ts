import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import type { Commitment, Deposit } from "@prisma/client"
import { describe, expect, it } from "vitest"

import { CommitmentTable, DepositTable } from "@/components/budget/item-table"
import { dictionaries } from "@/lib/i18n/dictionaries"

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  const now = new Date("2026-01-01T00:00:00.000Z")

  return {
    id: "commitment-1",
    householdId: "household-1",
    planId: "plan-1",
    name: "Internet",
    category: "Casa",
    icon: "receipt",
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

function deposit(overrides: Partial<Deposit> = {}): Deposit {
  const now = new Date("2026-01-01T00:00:00.000Z")

  return {
    id: "deposit-1",
    householdId: "household-1",
    planId: "plan-1",
    name: "Ayuda del estado",
    amountCents: 300_00,
    icon: "state-aid",
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
        onUpdate: async () => {},
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
        onUpdate: async () => {},
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

  it("renders row actions without inline delete labels", () => {
    const html = renderToStaticMarkup(
      createElement(CommitmentTable, {
        commitments: [commitment()],
        dictionary: dictionaries.es,
        locale: "es",
        onDelete: async () => {},
        onUpdate: async () => {},
        title: dictionaries.es.nav.monthlyBills,
      })
    )

    expect(html).toContain(dictionaries.es.actions.actionsMenu)
    expect(html).not.toContain("Delete Internet")
  })
})

describe("DepositTable", () => {
  it("renders income rows with their selected icon label data", () => {
    const html = renderToStaticMarkup(
      createElement(DepositTable, {
        deposits: [deposit()],
        dictionary: dictionaries.es,
        locale: "es",
        onDelete: async () => {},
        onUpdate: async () => {},
      })
    )

    expect(html).toContain("Ayuda del estado")
    expect(html).toContain("300")
    expect(html).toContain("text-warning")
  })
})
