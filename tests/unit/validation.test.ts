import { describe, expect, it } from "vitest"

import { commitmentSchema, depositSchema, planSettingsSchema } from "@/lib/validations/budget"
import { householdNameSchema } from "@/lib/validations/household"

describe("budget validation", () => {
  it("accepts valid deposits", () => {
    expect(depositSchema.safeParse({ name: "Member deposit", amount: 1800 }).success).toBe(true)
  })

  it("rejects missing commitment categories", () => {
    expect(
      commitmentSchema.safeParse({
        name: "Hipoteca",
        amount: 1110,
        category: "",
        frequency: "MONTHLY",
        type: "BILL",
      }).success
    ).toBe(false)
  })

  it("accepts known commitment icons and defaults missing icons", () => {
    const parsed = commitmentSchema.parse({
      name: "Hipoteca",
      amount: 1110,
      category: "Casa",
      icon: "home",
      frequency: "MONTHLY",
      type: "BILL",
    })

    expect(parsed.icon).toBe("home")
    expect(
      commitmentSchema.parse({
        name: "Recibo",
        amount: 40,
        category: "Casa",
        frequency: "MONTHLY",
        type: "BILL",
      }).icon
    ).toBe("receipt")
  })

  it("trims and validates household names", () => {
    expect(householdNameSchema.parse(" Casa nueva ")).toBe("Casa nueva")
    expect(householdNameSchema.safeParse("").success).toBe(false)
  })

  it("validates the monthly result margin percentage", () => {
    expect(planSettingsSchema.parse({ lowMonthlyMarginPercent: "7.5" })).toEqual({
      lowMonthlyMarginPercent: 7.5,
    })
    expect(planSettingsSchema.safeParse({ lowMonthlyMarginPercent: -1 }).success).toBe(false)
    expect(planSettingsSchema.safeParse({ lowMonthlyMarginPercent: 101 }).success).toBe(false)
  })
})
