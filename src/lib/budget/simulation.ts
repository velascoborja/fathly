import type { Deposit } from "@prisma/client"
import type { CommitmentWithParts } from "@/lib/budget/types"
import { centsFromDecimalInput } from "@/lib/budget/format"
import { getCategoryNameSchema, getCommitmentSchema, getDepositSchema } from "@/lib/validations/budget"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Messages = (typeof dictionaries)[Locale]["validation"]
export type SimulationBudget = { deposits: Deposit[]; commitments: CommitmentWithParts[] }
export type SimulationChange =
  | { kind: "reset"; state: SimulationBudget }
  | { kind: "deposit"; id: string; item?: Deposit }
  | { kind: "commitment"; id: string; item?: CommitmentWithParts }
  | { kind: "category"; from: string; to: string }

function replaceItem<T extends { id: string }>(items: T[], id: string, replacement?: T): T[] {
  if (!replacement) return items.filter(item => item.id !== id)
  if (!items.some(item => item.id === id)) return [...items, replacement]
  return items.map(item => item.id === id ? replacement : item)
}

export function updateSimulation(state: SimulationBudget, change: SimulationChange): SimulationBudget {
  switch (change.kind) {
    case "reset":
      return structuredClone(change.state)
    case "category":
      return { ...state, commitments: state.commitments.map(item => item.category === change.from ? { ...item, category: change.to } : item) }
    case "deposit":
      return { ...state, deposits: replaceItem(state.deposits, change.id, change.item) }
    case "commitment":
      return { ...state, commitments: replaceItem(state.commitments, change.id, change.item) }
  }
}

export function simulationDeposit(form: FormData, messages: Messages) {
  const input = getDepositSchema(messages).parse(Object.fromEntries(form))
  return { name: input.name, amountCents: centsFromDecimalInput(input.amount), icon: input.icon, notes: input.notes ?? null }
}

export function simulationCommitment(form: FormData, messages: Messages) {
  const input = getCommitmentSchema(messages).parse({ ...Object.fromEntries(form), parts: JSON.parse(String(form.get("parts") ?? "[]")) })
  return { name: input.name, category: input.category, icon: input.icon, frequency: input.frequency, type: input.type, notes: input.notes ?? null, amountMode: input.amountMode,
    amountCents: input.amountMode === "FIXED" ? centsFromDecimalInput(input.amount) : null,
    parts: input.amountMode === "ITEMIZED" ? input.parts.map(part => ({ name: part.name, amountCents: centsFromDecimalInput(part.amount) })) : [] }
}

export function simulationCategory(state: SimulationBudget, from: string, value: unknown, messages: Messages) {
  const to = getCategoryNameSchema(messages).parse(value)
  if (to === from) throw new Error(messages.categoryUnchanged)
  if (state.commitments.some(item => item.category !== from && item.category.toLocaleLowerCase() === to.toLocaleLowerCase())) throw new Error(messages.categoryDuplicate)
  return to
}
