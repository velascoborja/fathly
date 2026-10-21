import type { Metadata } from "next"
import Link from "next/link"

import { auth } from "@/auth"
import { AppIcon } from "@/components/app/app-icon"
import { InvitationAcceptButton } from "@/components/app/invitation-accept-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { prisma } from "@/lib/prisma"
import { signInWithGoogle } from "@/server/actions"
import { acceptHouseholdInvitation } from "@/server/household-actions"
import { findInvitation, invitationState } from "@/server/invitations"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [session, dictionary, invitation] = await Promise.all([auth(), getServerDictionary(), findInvitation(token)])
  const state = invitationState(invitation)
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerified: true } })
    : null
  const matchingEmail = Boolean(user?.email && user.email.toLowerCase() === invitation?.email)
  const member =
    state === "used" && matchingEmail && session?.user?.id && invitation
      ? await prisma.householdMember.findUnique({
          where: { householdId_userId: { householdId: invitation.householdId, userId: session.user.id } },
        })
      : null
  const canAccept = state === "pending" || (state === "used" && Boolean(member))
  const returnTo = `/invite/${token}`
  const showDetails = canAccept && matchingEmail && invitation

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="fathly-card w-full max-w-md">
        <CardHeader className="text-center">
          <AppIcon className="mx-auto mb-3 size-14" size={56} />
          <CardTitle className="text-2xl">{dictionary.sharing.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!canAccept ? <p role="status">{dictionary.sharing[state]}</p> : null}
          {canAccept && !user ? <p>{dictionary.sharing.signInHelp}</p> : null}
          {canAccept && user && !matchingEmail ? <p role="alert">{dictionary.sharing.wrongAccount}</p> : null}
          {showDetails ? (
            <div className="flex flex-col gap-3">
              <h2 className="break-words text-xl font-bold">{invitation.household.name}</h2>
              <Badge className="self-start">{dictionary.sharing.roles[invitation.role]}</Badge>
              <p className="text-sm text-muted-foreground">{dictionary.sharing.acceptHelp}</p>
              {!user?.emailVerified ? <p>{dictionary.sharing.verify}</p> : null}
            </div>
          ) : null}
          {canAccept && (!matchingEmail || !user?.emailVerified) ? (
            <form action={signInWithGoogle}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <Button className="min-h-11 w-full" type="submit">
                {user ? dictionary.sharing.switchAccount : dictionary.actions.signIn}
              </Button>
            </form>
          ) : null}
          {showDetails && user?.emailVerified ? (
            <InvitationAcceptButton
              action={acceptHouseholdInvitation.bind(null, token)}
              label={state === "used" ? dictionary.sharing.dashboard : dictionary.sharing.accept}
              pendingLabel={dictionary.sharing.accepting}
              errorLabel={dictionary.sharing.operationError}
            />
          ) : null}
          {!(showDetails && user?.emailVerified && state === "used") ? (
            <Button
              className="min-h-11"
              nativeButton={false}
              render={<Link href={session?.user ? "/dashboard" : "/auth/signin"} />}
              variant="ghost"
            >
              {dictionary.sharing.dashboard}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
