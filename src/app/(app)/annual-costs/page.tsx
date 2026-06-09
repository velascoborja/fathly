import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { CommitmentTable } from "@/components/budget/item-table"
import { createCommitment, deleteCommitment } from "@/server/actions"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { getBudgetData } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function AnnualCostsPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const commitments = data.commitments.filter((commitment) => commitment.type === "BILL" && commitment.frequency === "ANNUAL")

  return (
    <>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">{dictionary.nav.annualCosts}</h1>
          <p className="mt-2 text-muted-foreground">{dictionary.annualCosts.subtitle}</p>
        </div>
        <BudgetDialogForm
          action={createCommitment}
          defaults={{ frequency: "ANNUAL", type: "BILL" }}
          dictionary={dictionary}
          kind="commitment"
        />
      </section>
      <CommitmentTable
        commitments={commitments}
        dictionary={dictionary}
        hideFrequency
        locale={locale}
        onDelete={deleteCommitment}
        showProratedAmount
        title={dictionary.nav.annualCosts}
      />
    </>
  )
}
