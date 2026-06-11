import { SettingsIcon } from "lucide-react"

import { HouseholdNameForm } from "@/components/app/household-name-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { updateHouseholdName } from "@/server/actions"
import { getActiveHouseholdContext } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [context, dictionary] = await Promise.all([getActiveHouseholdContext(), getServerDictionary()])

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="fathly-section-title flex items-center gap-2 text-3xl">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <SettingsIcon className="size-5" />
          </span>
          {dictionary.nav.settings}
        </h1>
        <p className="mt-2 text-muted-foreground">{dictionary.settings.householdCardDescription}</p>
      </div>

      <Card className="fathly-card border-primary/40">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.settings.householdCardTitle}</CardTitle>
          <CardDescription>{dictionary.settings.householdCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdNameForm
            action={updateHouseholdName}
            dictionary={dictionary}
            householdName={context.household.name}
          />
        </CardContent>
      </Card>
    </section>
  )
}
