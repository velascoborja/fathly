import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { Suspense } from "react"

import AuthenticatedLayout from "@/app/(app)/layout"
import { AppShellLoading } from "@/components/app/app-shell-loading"

vi.mock("@/server/household", () => ({ getActiveHouseholdContext: vi.fn() }))
vi.mock("@/components/app/app-shell", () => ({ AppShell: vi.fn() }))

const source = readFileSync("src/components/app/app-shell.tsx", "utf8")

describe("AppShell layout", () => {
  it("renders a loading boundary before awaiting the session and household", () => {
    const layout = AuthenticatedLayout({ children: null })

    expect(layout.type).toBe(Suspense)
    expect(layout.props.fallback.type).toBe(AppShellLoading)
    expect(layout.props.children.props.children).toBeNull()
  })
  it("uses dashboard-only chrome without sidebar or mobile route navigation", () => {
    expect(source).not.toContain("@/components/ui/sidebar")
    expect(source).not.toContain("Primary mobile navigation")
    expect(source).not.toContain("dictionary.nav.deposits")
    expect(source).not.toContain("dictionary.nav.monthlyBills")
    expect(source).toContain("dictionary.nav.dashboard")
    expect(source).toContain("dictionary.nav.settings")
    expect(source).toContain("setLocaleAction")
    expect(source).toContain("signOutUser")
    expect(source).toContain("householdName")
    expect(source).toContain("lg:hidden")
    expect(source).toContain("DropdownMenu")
    expect(source).toContain("hidden min-w-0 flex-nowrap items-center gap-2 lg:flex")
  })
})
