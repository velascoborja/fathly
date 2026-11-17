import { redirect } from "next/navigation"
import { BudgetView } from "@/components/budget/budget-view"
import { CheckpointDialogForm } from "@/components/budget/checkpoint-dialog-form"
import { Button } from "@/components/ui/button"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { canEditBudget } from "@/lib/household-access"
import {
  createCommitment,
  createCheckpoint,
  createDeposit,
  deleteCommitment,
  deleteDeposit,
  moveCommitmentCategory,
  renameCommitmentCategory,
  updateCommitment,
  updateDeposit,
} from "@/server/actions"
import { getBudgetData } from "@/server/household"

export const dynamic = "force-dynamic"
export default async function DashboardPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const canEdit = canEditBudget(data.membership.role)
  const hasData = data.deposits.length > 0 || data.commitments.length > 0
  if (canEdit && !data.plan.onboardingCompletedAt && !hasData) redirect("/setup")
  return <BudgetView data={data} dictionary={dictionary} locale={locale} canEdit={canEdit}
    actions={{ createDeposit, updateDeposit, deleteDeposit, createCommitment, updateCommitment, deleteCommitment, moveCommitmentCategory, renameCommitmentCategory }}
    header={<div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-bold md:text-4xl">{dictionary.dashboard.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">{dictionary.dashboard.subtitle}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href="/simulation" />}>{dictionary.simulation.start}</Button>
        {canEdit ? <CheckpointDialogForm action={createCheckpoint.bind(null, data.household.id)} dictionary={dictionary} /> : null}
      </div>
    </div>} />
}
