import { Simulation } from "@/components/budget/simulation"
import { getBudgetData } from "@/server/household"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"

export const dynamic = "force-dynamic"

export default async function SimulationPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  return <Simulation key={`${data.user.id}:${data.household.id}:${data.plan.id}`} data={{ household: { id: data.household.id }, plan: { lowMonthlyMarginBasisPoints: data.plan.lowMonthlyMarginBasisPoints }, deposits: data.deposits, commitments: data.commitments }} dictionary={dictionary} locale={locale} />
}
