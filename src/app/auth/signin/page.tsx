import { redirect } from "next/navigation"
import Link from "next/link"

import { auth } from "@/auth"
import { AppIcon } from "@/components/app/app-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerDictionary } from "@/lib/i18n/server"
import { signInWithGoogle } from "@/server/actions"

export const dynamic = "force-dynamic"

export default async function SignInPage() {
  const session = await auth()
  const dictionary = await getServerDictionary()
  const showMockDemo = process.env.NODE_ENV === "development"

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="fathly-card w-full max-w-md border-primary/30">
        <CardHeader className="gap-4 text-center">
          <AppIcon className="mx-auto size-14" size={56} />
          <div>
            <CardTitle className="fathly-wordmark justify-center text-lg">{dictionary.appName}</CardTitle>
            <CardDescription className="mt-2">{dictionary.dashboard.subtitle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={signInWithGoogle} className="flex flex-col gap-3">
            <Button className="w-full" size="lg" type="submit">
              <GoogleLogo />
              {dictionary.actions.signIn}
            </Button>
            {showMockDemo ? (
              <Button nativeButton={false} render={<Link href="/demo" />} className="w-full" size="lg" variant="outline">
                View mock demo
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="size-5" data-icon="inline-start" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  )
}
