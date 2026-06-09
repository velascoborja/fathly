import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { DepositTable } from "@/components/budget/item-table"
import { createDeposit, deleteDeposit } from "@/server/actions"
import { getBudgetData } from "@/server/household"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"

export const dynamic = "force-dynamic"

export default async function DepositsPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])

  return (
    <>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">{dictionary.nav.deposits}</h1>
          <p className="mt-2 text-muted-foreground">{dictionary.deposits.subtitle}</p>
        </div>
        <BudgetDialogForm action={createDeposit} dictionary={dictionary} kind="deposit" />
      </section>
      <DepositTable deposits={data.deposits} dictionary={dictionary} locale={locale} onDelete={deleteDeposit} />
    </>
  )
}
