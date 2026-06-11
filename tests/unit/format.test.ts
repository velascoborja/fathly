import { describe, expect, it } from "vitest"

import { centsFromDecimalInput, formatBudgetUsagePercent, formatCurrency, formatWholeCurrency } from "@/lib/budget/format"

describe("formatting", () => {
  it("formats euro currency for Spanish and English", () => {
    expect(formatCurrency(380_000, "es")).toBe("3800€")
    expect(formatCurrency(380_000, "en")).toContain("€3,800")
  })

  it("formats whole euro currency without decimals", () => {
    expect(formatWholeCurrency(15_450, "es")).toBe("155€")
    expect(formatWholeCurrency(15_450, "en")).toBe("€155")
  })

  it("keeps Spanish decimal formatting tight against the euro symbol", () => {
    expect(formatCurrency(12_345, "es")).toBe("123,45€")
  })

  it("parses decimal money input to cents", () => {
    expect(centsFromDecimalInput("12,34")).toBe(1234)
    expect(centsFromDecimalInput("12.35")).toBe(1235)
  })

  it("does not round budget usage below full coverage up to 100%", () => {
    expect(formatBudgetUsagePercent(4379 / 4400, "es")).toBe("99,5%")
    expect(formatBudgetUsagePercent(4379 / 4400, "en")).toBe("99.5%")
    expect(formatBudgetUsagePercent(1, "es")).toBe("100%")
  })
})
