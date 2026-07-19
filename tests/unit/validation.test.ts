import { describe, expect, it } from "vitest"

import {
  categoryNameSchema,
  checkpointSchema,
  commitmentSchema,
  depositSchema,
  initialSetupSchema,
  planSettingsSchema,
} from "@/lib/validations/budget"
import { householdInviteSchema, householdNameSchema } from "@/lib/validations/household"

describe("budget validation", () => {
  it("accepts valid deposits", () => {
    expect(depositSchema.safeParse({ name: "Member deposit", amount: 1800 }).success).toBe(true)
  })

  it("accepts known deposit icons and defaults missing icons", () => {
    const parsed = depositSchema.parse({
      name: "Ayuda del estado",
      amount: 300,
      icon: "state-aid",
    })

    expect(parsed.icon).toBe("state-aid")
    expect(depositSchema.parse({ name: "Member deposit", amount: 1800 }).icon).toBe("income")
    expect(depositSchema.safeParse({ name: "Member deposit", amount: 1800, icon: "receipt" }).success).toBe(false)
  })

  it("rejects missing commitment categories", () => {
    expect(
      commitmentSchema.safeParse({
        name: "Hipoteca",
        amountMode: "FIXED",
        amount: 1110,
        category: "",
        frequency: "MONTHLY",
        type: "BILL",
      }).success
    ).toBe(false)
  })

  it("trims and validates category names", () => {
    expect(categoryNameSchema.parse(" Suministros ")).toBe("Suministros")
    expect(categoryNameSchema.safeParse("").success).toBe(false)
    expect(categoryNameSchema.safeParse("x".repeat(61)).success).toBe(false)
  })

  it("rejects savings as a commitment type", () => {
    expect(
      commitmentSchema.safeParse({
        name: "Holiday fund",
        amountMode: "FIXED",
        amount: 150,
        category: "Fund",
        frequency: "MONTHLY",
        type: "SAVINGS",
      }).success
    ).toBe(false)
  })

  it("accepts known commitment icons and defaults missing icons", () => {
    const parsed = commitmentSchema.parse({
      name: "Hipoteca",
      amountMode: "FIXED",
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
        amountMode: "FIXED",
        amount: 40,
        category: "Casa",
        frequency: "MONTHLY",
        type: "BILL",
      }).icon
    ).toBe("receipt")
  })

  it("validates itemized commitments and their limits", () => {
    const valid = {
      name: "Suministros",
      amountMode: "ITEMIZED" as const,
      parts: [
        { name: "Luz", amount: 50 },
        { name: "Agua", amount: 25 },
      ],
      category: "Casa",
      frequency: "MONTHLY" as const,
      type: "BILL" as const,
    }

    expect(commitmentSchema.safeParse(valid).success).toBe(true)
    expect(commitmentSchema.parse({ ...valid, amount: 125 })).toMatchObject({
      amountMode: "ITEMIZED",
      amount: undefined,
    })
    expect(commitmentSchema.safeParse({ ...valid, parts: valid.parts.slice(0, 1) }).success).toBe(false)
    expect(commitmentSchema.safeParse({ ...valid, parts: [{ name: "", amount: 50 }, valid.parts[1]] }).success).toBe(false)
    expect(commitmentSchema.safeParse({ ...valid, parts: [...valid.parts, ...Array.from({ length: 19 }, (_, index) => ({ name: `Part ${index}`, amount: 1 }))] }).success).toBe(false)
  })

  it("trims and validates household names", () => {
    expect(householdNameSchema.parse(" Casa nueva ")).toBe("Casa nueva")
    expect(householdNameSchema.safeParse("").success).toBe(false)
  })

  it("normalizes and validates household share emails", () => {
    expect(householdInviteSchema.parse({ email: " PERSON@example.COM " })).toEqual({
      email: "person@example.com",
    })
    expect(householdInviteSchema.safeParse({ email: "not-an-email" }).success).toBe(false)
  })

  it("validates the monthly result margin percentage", () => {
    expect(planSettingsSchema.parse({ lowMonthlyMarginPercent: "7.5" })).toEqual({
      lowMonthlyMarginPercent: 7.5,
    })
    expect(planSettingsSchema.safeParse({ lowMonthlyMarginPercent: -1 }).success).toBe(false)
    expect(planSettingsSchema.safeParse({ lowMonthlyMarginPercent: 101 }).success).toBe(false)
  })

  it("trims and validates checkpoint names", () => {
    expect(checkpointSchema.parse({ name: " Antes del cole " })).toEqual({ name: "Antes del cole" })
    expect(checkpointSchema.safeParse({ name: "" }).success).toBe(false)
    expect(checkpointSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false)
  })

  it("normalizes first-run setup rows and rejects incomplete onboarding data", () => {
    const parsed = initialSetupSchema.parse({
      deposits: [
        { name: " Alex ", amount: "1800" },
        { name: "", amount: "" },
      ],
      monthlyBills: [{ name: "Rent", amount: "950" }],
    })

    expect(parsed.deposits).toEqual([{ name: "Alex", amount: 1800 }])
    expect(parsed.monthlyBills).toEqual([{ name: "Rent", amount: 950 }])
    expect(initialSetupSchema.safeParse({
      deposits: [{ name: "Alex", amount: "1800" }],
      monthlyBills: [{ name: "", amount: "" }],
      annualCosts: [{ name: "Home insurance", amount: "600" }],
    }).success).toBe(false)
    expect(initialSetupSchema.safeParse({
      deposits: [{ name: "Alex", amount: "" }],
      monthlyBills: [{ name: "Rent", amount: "950" }],
    }).success).toBe(false)
    expect(initialSetupSchema.safeParse({
      deposits: [{ name: "Alex", amount: "1800" }],
      monthlyBills: [{ name: "", amount: "" }],
    }).success).toBe(false)
  })
})
