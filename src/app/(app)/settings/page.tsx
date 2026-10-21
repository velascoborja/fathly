import { SettingsIcon, Trash2Icon, UsersIcon } from "lucide-react"

import { AccountDeleteDialog } from "@/components/app/account-delete-dialog"
import { HouseholdAccessForm } from "@/components/app/household-access-form"
import { HouseholdNameForm } from "@/components/app/household-name-form"
import { PlanSettingsForm } from "@/components/app/plan-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"
import { deleteUserAccount, updateHouseholdName, updatePlanSettings } from "@/server/actions"
import { createHouseholdInvitation } from "@/server/household-actions"
import { getOwnershipTransfers } from "@/server/account"
import { getActiveHouseholdContext } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [context, dictionary, locale, transfers] = await Promise.all([getActiveHouseholdContext(), getServerDictionary(), getLocale(), getOwnershipTransfers()])
  const isOwner = context.membership.role === "OWNER"
  const invitations = isOwner ? await prisma.householdInvitation.findMany({
    where: { householdId: context.household.id, acceptedAt: null, cancelledAt: null },
    select: { id: true, email: true, role: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  }) : []
  const members = await prisma.householdMember.findMany({
    where: {
      householdId: context.household.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      {
        role: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  })

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="fathly-section-title flex items-center gap-2 text-3xl">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <SettingsIcon className="size-5" />
          </span>
          {dictionary.nav.settings}
        </h1>
      </div>

      <Card className="fathly-card border-primary/40">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.settings.householdCardTitle}</CardTitle>
          <CardDescription>{dictionary.settings.householdCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdNameForm
            readOnly={!isOwner}
            action={updateHouseholdName.bind(null, context.household.id)}
            dictionary={dictionary}
            householdName={context.household.name}
          />
        </CardContent>
      </Card>

      <Card className="fathly-card border-accent/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UsersIcon className="size-5 text-primary" />
            {dictionary.settings.shareAccessCardTitle}
          </CardTitle>
          <CardDescription>{dictionary.settings.shareAccessCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdAccessForm
            key={context.household.id}
            householdId={context.household.id}
            locale={locale}
            invitations={invitations.map((invitation) => ({ ...invitation, expiresAt: invitation.expiresAt.toISOString() }))}
            action={createHouseholdInvitation.bind(null, context.household.id)}
            dictionary={dictionary}
            isOwner={context.membership.role === "OWNER"}
            members={members}
          />
        </CardContent>
      </Card>

      <Card className="fathly-card border-warning/40">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.settings.planSettingsCardTitle}</CardTitle>
          <CardDescription>{dictionary.settings.planSettingsCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanSettingsForm
            readOnly={!isOwner}
            action={updatePlanSettings.bind(null, context.household.id)}
            dictionary={dictionary}
            lowMonthlyMarginBasisPoints={context.plan.lowMonthlyMarginBasisPoints}
          />
        </CardContent>
      </Card>

      <Card className="fathly-card border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trash2Icon className="size-5 text-destructive" />
            {dictionary.settings.accountDangerCardTitle}
          </CardTitle>
          <CardDescription>{dictionary.settings.accountDangerCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountDeleteDialog action={deleteUserAccount} dictionary={dictionary} transfers={transfers} />
        </CardContent>
      </Card>
    </section>
  )
}
