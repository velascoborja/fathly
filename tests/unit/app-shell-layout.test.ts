import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/components/app/app-shell.tsx", "utf8")

describe("AppShell layout", () => {
  it("removes the global header and keeps mobile navigation available", () => {
    expect(source).not.toContain("<header")
    expect(source).toContain('aria-label="Primary mobile navigation"')
    expect(source).toContain("dictionary.nav.dashboard")
    expect(source).toContain("dictionary.nav.deposits")
    expect(source).toContain("dictionary.nav.monthlyBills")
    expect(source).toContain("dictionary.nav.more")
  })
})
