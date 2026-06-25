import { describe, expect, it } from "vitest"

import { inferDepositIcon } from "@/lib/budget/deposit-icons"

describe("deposit icon inference", () => {
  it.each([
    ["Nómina Alex", "salary"],
    ["Freelance June", "work"],
    ["Transferencia banco", "bank"],
    ["Ahorro compartido", "savings"],
    ["Ayuda del estado", "state-aid"],
    ["Prestación SEPE", "state-aid"],
    ["Government benefit", "state-aid"],
  ])("infers %s as %s", (name, icon) => {
    expect(inferDepositIcon(name)).toBe(icon)
  })

  it("falls back to income for unknown names", () => {
    expect(inferDepositIcon("Something custom")).toBe("income")
  })
})
