import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/components/app/app-shell.tsx", "utf8")

describe("AppShell layout", () => {
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
