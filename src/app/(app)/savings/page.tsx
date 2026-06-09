import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { CommitmentTable } from "@/components/budget/item-table"
import { createCommitment, deleteCommitment } from "@/server/actions"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { getBudgetData } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function SavingsPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const commitments = data.commitments.filter((commitment) => commitment.type === "SAVINGS")

  return (
    <>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">{dictionary.nav.savings}</h1>
          <p className="mt-2 text-muted-foreground">{dictionary.dashboard.savings}</p>
        </div>
        <BudgetDialogForm
          action={createCommitment}
          defaults={{ category: "Ahorro", frequency: "MONTHLY", type: "SAVINGS" }}
          dictionary={dictionary}
          kind="commitment"
        />
      </section>
      <CommitmentTable
        commitments={commitments}
        dictionary={dictionary}
        locale={locale}
        onDelete={deleteCommitment}
        title={dictionary.nav.savings}
      />
    </>
  )
}
