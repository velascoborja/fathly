"use client"

import { useEffect, useReducer } from "react"
import { BudgetView, type BudgetActions, type BudgetViewData } from "@/components/budget/budget-view"
import { SimulationContext } from "@/components/budget/simulation-context"
import { Button } from "@/components/ui/button"
import { simulationCategory, simulationCommitment, simulationDeposit, updateSimulation } from "@/lib/budget/simulation"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

export function Simulation({ data, dictionary, locale }: { data: BudgetViewData; dictionary: (typeof dictionaries)[Locale]; locale: Locale }) {
  const [draft, dispatch] = useReducer(updateSimulation, data, initial => structuredClone(initial))
  // A restored browser history entry must start a fresh simulation.
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload() }
    window.addEventListener("pageshow", restore)
    return () => {
      window.removeEventListener("pageshow", restore)
      dispatch({ kind: "reset", state: data })
    }
  }, [data])
  const metadata = (id: string) => ({ id, householdId: data.household.id, planId: "simulation", status: "ACTIVE" as const, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() })
  const actions: BudgetActions = {
    async createDeposit(_, form) { const id = crypto.randomUUID(); dispatch({ kind: "deposit", id, item: { ...metadata(id), ...simulationDeposit(form, dictionary.validation) } }) },
    async updateDeposit(_, id, form) { const current = draft.deposits.find(item => item.id === id); if (current) dispatch({ kind: "deposit", id, item: { ...current, ...simulationDeposit(form, dictionary.validation) } }) },
    async deleteDeposit(_, id) { dispatch({ kind: "deposit", id }) },
    async createCommitment(_, form) { const id = crypto.randomUUID(); const input = simulationCommitment(form, dictionary.validation); dispatch({ kind: "commitment", id, item: { ...metadata(id), ...input, parts: input.parts.map((part, sortOrder) => ({ ...metadata(crypto.randomUUID()), ...part, commitmentId: id, sortOrder })) } }) },
    async updateCommitment(_, id, form) { const current = draft.commitments.find(item => item.id === id); const input = simulationCommitment(form, dictionary.validation); if (current) dispatch({ kind: "commitment", id, item: { ...current, ...input, parts: input.parts.map((part, sortOrder) => ({ ...metadata(crypto.randomUUID()), ...part, commitmentId: id, sortOrder })) } }) },
    async deleteCommitment(_, id) { dispatch({ kind: "commitment", id }) },
    async moveCommitmentCategory(_, id, category) { const current = draft.commitments.find(item => item.id === id); if (current && draft.commitments.some(item => item.category === category)) dispatch({ kind: "commitment", id, item: { ...current, category } }) },
    async renameCommitmentCategory(_, from, form) { dispatch({ kind: "category", from, to: simulationCategory(draft, from, form.get("category"), dictionary.validation) }) },
  }
  return <SimulationContext value={true}><BudgetView data={{ ...data, ...draft }} dictionary={dictionary} locale={locale} canEdit actions={actions}
    header={<div className="flex w-full flex-wrap items-start justify-between gap-4 rounded-2xl border border-primary/40 bg-muted p-4">
      <div><h1 className="text-3xl font-bold">{dictionary.simulation.title}</h1><p className="mt-2 max-w-2xl text-sm" role="status">{dictionary.simulation.notice}</p></div>
      <Button nativeButton={false} render={<a href="/dashboard" />}>{dictionary.simulation.exit}</Button>
    </div>} /></SimulationContext>
}
