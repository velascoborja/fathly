"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import {
  BadgeEuroIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  CircleDollarSignIcon,
  HomeIcon,
  PiggyBankIcon,
  SettingsIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const navItems = [
    { href: "/dashboard", label: dictionary.nav.dashboard, icon: ChartPieIcon },
    { href: "/deposits", label: dictionary.nav.deposits, icon: CircleDollarSignIcon },
    { href: "/monthly-bills", label: dictionary.nav.monthlyBills, icon: HomeIcon },
    { href: "/annual-costs", label: dictionary.nav.annualCosts, icon: CalendarDaysIcon },
    { href: "/savings", label: dictionary.nav.savings, icon: PiggyBankIcon },
    { href: "/settings", label: dictionary.nav.settings, icon: SettingsIcon },
  ]

  return (
    <SidebarProvider>
      <Sidebar className="border-sidebar-border" collapsible="offcanvas">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link className="flex items-center gap-3" href="/dashboard">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#FFD21E] text-lg font-bold text-[#1C1C1C]">
              F
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold">{dictionary.appName}</span>
              <span className="text-xs text-muted-foreground">{householdName}</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage alt={user.name ?? user.email ?? "User"} src={user.image ?? undefined} />
              <AvatarFallback>{(user.name ?? user.email ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={isPending}
              onClick={() => startTransition(() => setLocaleAction(locale === "es" ? "en" : "es"))}
              size="sm"
              type="button"
              variant="outline"
            >
              {locale === "es" ? dictionary.actions.switchToEnglish : dictionary.actions.switchToSpanish}
            </Button>
            <Button disabled={isPending} onClick={() => startTransition(() => signOutUser())} size="sm" type="button" variant="ghost">
              {dictionary.actions.signOut}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-svh bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <BadgeEuroIcon className="text-primary" />
            <span className="font-semibold">{dictionary.dashboard.title}</span>
          </div>
          <div className="hidden rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground sm:block">
            EUR
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
