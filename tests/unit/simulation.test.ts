import { describe, expect, it } from "vitest"
import { simulationCategory, simulationCommitment, simulationDeposit, updateSimulation, type SimulationBudget } from "@/lib/budget/simulation"
import { calculateBudgetSummary } from "@/lib/budget/math"
import { dictionaries } from "@/lib/i18n/dictionaries"

const messages = dictionaries.es.validation
const metadata = { householdId: "home", planId: "plan", status: "ACTIVE" as const, sortOrder: 0, createdAt: new Date(0), updatedAt: new Date(0) }
const deposit = { ...metadata, id: "income", name: "Salary", icon: "income", notes: null, amountCents: 100_000 }
const expense = { ...metadata, id: "bill", name: "Rent", category: "Home", icon: "home", notes: null, amountCents: 50_000, amountMode: "FIXED" as const, type: "BILL" as const, frequency: "MONTHLY" as const, parts: [] }
const initial: SimulationBudget = { deposits: [deposit], commitments: [expense] }
const form = (values: Record<string, string>) => { const data = new FormData(); Object.entries(values).forEach(([key,value]) => data.set(key,value)); return data }

describe("private simulation", () => {
  it("adds, updates and deletes income without changing the source", () => {
    const before = structuredClone(initial)
    let draft = updateSimulation(initial, { kind: "deposit", id: "new", item: { ...deposit, id: "new", amountCents: 20_000 } })
    draft = updateSimulation(draft, { kind: "deposit", id: deposit.id, item: { ...deposit, amountCents: 150_000 } })
    expect(calculateBudgetSummary(draft.deposits, draft.commitments).coverageCents).toBe(120_000)
    draft = updateSimulation(draft, { kind: "deposit", id: "new" })
    expect(draft.deposits).toHaveLength(1)
    expect(initial).toEqual(before)
  })
  it("edits annual expenses, moves categories and removes concepts locally", () => {
    let draft = updateSimulation(initial, { kind: "commitment", id: "annual", item: { ...expense, id: "annual", frequency: "ANNUAL", amountCents: 120_000 } })
    draft = updateSimulation(draft, { kind: "category", from: "Home", to: "House" })
    expect(draft.commitments.every(item => item.category === "House")).toBe(true)
    expect(calculateBudgetSummary(draft.deposits, draft.commitments).monthlyCommitmentsCents).toBe(60_000)
    draft = updateSimulation(draft, { kind: "commitment", id: "bill" })
    draft = updateSimulation(draft, { kind: "commitment", id: "annual" })
    expect(calculateBudgetSummary([], draft.commitments).coverageCents).toBe(0)
    expect(initial.commitments).toEqual([expense])
    expect(updateSimulation(draft, { kind: "reset", state: initial })).toEqual(initial)
  })
  it("validates amounts and converts to integer cents", () => {
    expect(simulationDeposit(form({ name: "Income", amount: "123.45" }), messages).amountCents).toBe(12_345)
    expect(() => simulationDeposit(form({ name: "Income", amount: "-1" }), messages)).toThrow()
    expect(() => simulationDeposit(form({ name: "", amount: "10" }), messages)).toThrow()
  })
  it("derives itemized totals and discards the hidden fixed amount", () => {
    const item = simulationCommitment(form({ name: "Annual", category: "House", icon: "home", frequency: "ANNUAL", amountMode: "ITEMIZED", amount: "999", parts: JSON.stringify([{ name: "A", amount: 120 }, { name: "B", amount: 240 }]) }), messages)
    expect(item.amountCents).toBeNull()
    expect(calculateBudgetSummary([], [{ ...expense, ...item }]).monthlyCommitmentsCents).toBe(3_000)
  })
  it("keeps existing category validation rules", () => {
    expect(() => simulationCategory(initial, "Other", "home", messages)).toThrow(messages.categoryDuplicate)
    expect(() => simulationCategory(initial, "Home", "Home", messages)).toThrow(messages.categoryUnchanged)
    expect(simulationCategory(initial, "Home", " House ", messages)).toBe("House")
  })
  it("provides matching copy in both languages", () => {
    expect(Object.keys(dictionaries.es.simulation)).toEqual(Object.keys(dictionaries.en.simulation))
  })
})
