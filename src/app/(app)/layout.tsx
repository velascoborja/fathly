import { AppShell } from "@/components/app/app-shell"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { getActiveHouseholdContext } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [context, dictionary, locale] = await Promise.all([
    getActiveHouseholdContext(),
    getServerDictionary(),
    getLocale(),
  ])

  return (
    <AppShell
      dictionary={dictionary}
      householdName={context.household.name}
      locale={locale}
      user={context.user}
    >
      {children}
    </AppShell>
  )
}
