import { redirect } from "next/navigation"
import Link from "next/link"
import { BadgeEuroIcon } from "lucide-react"

import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { signInWithGoogle } from "@/server/actions"

export const dynamic = "force-dynamic"

export default async function SignInPage() {
  const session = await auth()
  const dictionary = await getServerDictionary()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="fathly-card w-full max-w-md">
        <CardHeader className="gap-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#FFD21E] text-[#1C1C1C]">
            <BadgeEuroIcon />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">{dictionary.appName}</CardTitle>
            <CardDescription className="mt-2">{dictionary.dashboard.subtitle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={signInWithGoogle} className="flex flex-col gap-3">
            <Button className="w-full" size="lg" type="submit">
              {dictionary.actions.signIn}
            </Button>
            <Button nativeButton={false} render={<Link href="/demo" />} className="w-full" size="lg" variant="outline">
              View mock demo
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
