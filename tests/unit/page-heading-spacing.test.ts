import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const pages = [
  "src/app/(app)/dashboard/page.tsx",
  "src/app/(app)/deposits/page.tsx",
  "src/app/(app)/monthly-bills/page.tsx",
  "src/app/(app)/annual-costs/page.tsx",
  "src/app/(app)/savings/page.tsx",
  "src/app/(app)/settings/page.tsx",
]

describe("page heading spacing", () => {
  it("uses the same top margin between page titles and subtitles", () => {
    for (const page of pages) {
      const source = readFileSync(page, "utf8")

      expect(source, page).toContain("mt-2")
    }
  })
})
