import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const legacyPages = [
  "src/app/(app)/deposits/page.tsx",
  "src/app/(app)/monthly-bills/page.tsx",
  "src/app/(app)/annual-costs/page.tsx",
  "src/app/(app)/savings/page.tsx",
  "src/app/(app)/settings/page.tsx",
]

describe("legacy authenticated routes", () => {
  it("redirects all old section pages to the dashboard", () => {
    for (const page of legacyPages) {
      const source = readFileSync(page, "utf8")

      expect(source, page).toContain('redirect("/dashboard")')
      expect(source, page).not.toContain("getBudgetData")
    }
  })
})
