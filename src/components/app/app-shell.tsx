"use client"

import { useTransition } from "react"
import { LogOutIcon, LanguagesIcon } from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { setLocaleAction, signOutUser } from "@/server/actions"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type AppShellProps = {
  children: React.ReactNode
  dictionary: Dictionary
  householdName: string
  locale: Locale
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function AppShell({ children, dictionary, householdName, locale, user }: AppShellProps) {
  const [isPending, startTransition] = useTransition()
  const avatarLabel = user.name ?? user.email ?? "User"

  return (
    <div className="min-h-svh text-foreground">
      <header className="sticky top-0 z-30 border-b border-primary/20 bg-primary-bg/95 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AppIcon className="size-11 shrink-0 fathly-color-shadow" />
            <div className="min-w-0">
              <p className="fathly-ribbon text-sm leading-tight">{dictionary.appName}</p>
              <p className="mt-1 truncate text-sm font-bold text-primary-dark">{householdName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-primary/30 bg-cream px-2 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <Avatar className="size-8">
                <AvatarImage alt={avatarLabel} src={user.image ?? undefined} />
                <AvatarFallback>{avatarLabel.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[180px] truncate text-sm font-semibold sm:inline">{user.name ?? user.email}</span>
            </div>
            <Button
              disabled={isPending}
              onClick={() => startTransition(() => setLocaleAction(locale === "es" ? "en" : "es"))}
              size="sm"
              type="button"
              variant="outline"
            >
              <LanguagesIcon data-icon="inline-start" />
              {locale === "es" ? dictionary.actions.switchToEnglish : dictionary.actions.switchToSpanish}
            </Button>
            <Button disabled={isPending} onClick={() => startTransition(() => signOutUser())} size="sm" type="button" variant="ghost">
              <LogOutIcon data-icon="inline-start" />
              {dictionary.actions.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
