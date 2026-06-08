import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { getActiveHouseholdContext } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [context, dictionary] = await Promise.all([getActiveHouseholdContext(), getServerDictionary()])

  return (
    <>
      <section>
        <h1 className="text-3xl font-bold">{dictionary.nav.settings}</h1>
        <p className="text-muted-foreground">{dictionary.household}</p>
      </section>
      <Card className="fathly-card max-w-2xl">
        <CardHeader>
          <CardTitle>{context.household.name}</CardTitle>
          <CardDescription>{dictionary.dashboard.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between border-b pb-3">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{context.plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{context.membership.role}</span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
