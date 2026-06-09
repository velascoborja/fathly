import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("dashboard heading spacing", () => {
  it("keeps the dashboard title and subtitle visually grouped", () => {
    const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

    expect(source).toContain("mt-2")
  })
})
