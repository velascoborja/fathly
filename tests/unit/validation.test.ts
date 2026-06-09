import { describe, expect, it } from "vitest"

import { commitmentSchema, depositSchema } from "@/lib/validations/budget"
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

  it("trims and validates household names", () => {
    expect(householdNameSchema.parse(" Casa nueva ")).toBe("Casa nueva")
    expect(householdNameSchema.safeParse("").success).toBe(false)
  })
})
