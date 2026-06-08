import { describe, expect, it } from "vitest"

import { centsFromDecimalInput, formatCurrency } from "@/lib/budget/format"

describe("formatting", () => {
  it("formats euro currency for Spanish and English", () => {
    expect(formatCurrency(380_000, "es")).toContain("3800")
    expect(formatCurrency(380_000, "en")).toContain("€3,800")
  })

  it("parses decimal money input to cents", () => {
    expect(centsFromDecimalInput("12,34")).toBe(1234)
    expect(centsFromDecimalInput("12.35")).toBe(1235)
  })
})
