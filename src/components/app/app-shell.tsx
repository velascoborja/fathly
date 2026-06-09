"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import {
  CalendarDaysIcon,
  ChartPieIcon,
  CircleDollarSignIcon,
  HomeIcon,
  MoreHorizontalIcon,
  PiggyBankIcon,
  SettingsIcon,
} from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
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
  useSidebar,
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
            <AppIcon className="size-9" />
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
        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 p-4 pb-24 md:p-6">{children}</main>
        <MobileBottomNav dictionary={dictionary} pathname={pathname} />
      </SidebarInset>
    </SidebarProvider>
  )
}

function MobileBottomNav({ dictionary, pathname }: { dictionary: Dictionary; pathname: string }) {
  const { setOpenMobile } = useSidebar()
  const directItems = [
    { href: "/dashboard", label: dictionary.nav.dashboard, icon: ChartPieIcon },
    { href: "/deposits", label: dictionary.nav.deposits, icon: CircleDollarSignIcon },
    { href: "/monthly-bills", label: dictionary.nav.monthlyBills, icon: HomeIcon },
  ]
  const moreIsActive = ["/annual-costs", "/savings", "/settings"].includes(pathname)

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      {directItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className="flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground data-active:text-primary"
            data-active={isActive ? true : undefined}
            href={item.href}
            key={item.href}
          >
            <item.icon className="size-5" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        )
      })}
      <button
        aria-current={moreIsActive ? "page" : undefined}
        className="flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground data-active:text-primary"
        data-active={moreIsActive ? true : undefined}
        onClick={() => setOpenMobile(true)}
        type="button"
      >
        <MoreHorizontalIcon className="size-5" />
        <span className="max-w-full truncate">{dictionary.nav.more}</span>
      </button>
    </nav>
  )
}
