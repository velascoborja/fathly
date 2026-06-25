"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { ArchiveIcon, EllipsisIcon, HomeIcon, LanguagesIcon, Loader2Icon, LogOutIcon, SettingsIcon } from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
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
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const pathname = usePathname()
  const avatarLabel = user.name ?? user.email ?? dictionary.settings.unknownMember
  const userLabel = user.name ?? user.email
  const nextLocale = locale === "es" ? "en" : "es"
  const localeActionLabel = locale === "es" ? dictionary.actions.switchToEnglish : dictionary.actions.switchToSpanish
  const navItems = [
    { href: "/dashboard", icon: HomeIcon, label: dictionary.nav.dashboard },
    { href: "/checkpoints", icon: ArchiveIcon, label: dictionary.nav.checkpoints },
    { href: "/settings", icon: SettingsIcon, label: dictionary.nav.settings },
  ]

  return (
    <div className="min-h-svh text-foreground">
      <header className="z-30 border-b border-border bg-card/95 shadow-[0_1px_4px_rgba(0,0,0,0.08)] backdrop-blur md:sticky md:top-0">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:px-6 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(360px,1fr)]">
          <div className="flex min-w-0 items-center gap-3 md:justify-self-start">
            <AppIcon className="size-10 shrink-0" size={40} />
            <div className="min-w-0">
              <p className="fathly-wordmark text-[0.68rem] leading-tight">{dictionary.appName}</p>
              <p className="truncate text-lg font-bold leading-tight text-foreground">{householdName}</p>
            </div>
          </div>

          <div className="justify-self-end lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button aria-label={dictionary.actions.actionsMenu} disabled={isPending} size="icon-lg" type="button" variant="outline" />}
              >
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  {userLabel ? <DropdownMenuLabel className="truncate">{userLabel}</DropdownMenuLabel> : null}
                  <DropdownMenuItem onClick={() => startTransition(() => setLocaleAction(nextLocale))}>
                    <LanguagesIcon />
                    {localeActionLabel}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSignOutDialogOpen(true)}>
                  <LogOutIcon />
                  {dictionary.actions.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav
            aria-label={dictionary.nav.primary}
            className="col-span-2 flex w-full items-center gap-1 rounded-full border border-border bg-muted p-1 md:col-span-1 md:w-fit md:justify-self-center"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Button
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("flex-1 md:flex-none", isActive && "border-primary/40 bg-card text-primary shadow-[0_2px_8px_rgba(0,0,0,0.08)]")}
                  nativeButton={false}
                  render={<Link href={item.href} />}
                  size="sm"
                  variant="ghost"
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          <div className="hidden min-w-0 flex-nowrap items-center gap-2 lg:flex lg:justify-self-end">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-muted px-2 py-1">
              <Avatar className="size-8">
                <AvatarImage alt={avatarLabel} src={user.image ?? undefined} />
                <AvatarFallback>{avatarLabel.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="max-w-[160px] truncate text-sm font-semibold xl:max-w-[180px]">{userLabel}</span>
            </div>
            <Button
              disabled={isPending}
              onClick={() => startTransition(() => setLocaleAction(nextLocale))}
              size="sm"
              type="button"
              variant="outline"
            >
              <LanguagesIcon data-icon="inline-start" />
              {localeActionLabel}
            </Button>
            <Button disabled={isPending} onClick={() => setIsSignOutDialogOpen(true)} size="sm" type="button" variant="ghost">
              <LogOutIcon data-icon="inline-start" />
              {dictionary.actions.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        {children}
      </main>

      <Dialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dictionary.actions.signOutDialogTitle}</DialogTitle>
            <DialogDescription>{dictionary.actions.signOutDialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button disabled={isPending} type="button" variant="outline" />}>
              {dictionary.actions.cancel}
            </DialogClose>
            <Button disabled={isPending} onClick={() => startTransition(() => signOutUser())} type="button" variant="default">
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {isPending ? dictionary.actions.signingOut : dictionary.actions.confirmSignOut}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
