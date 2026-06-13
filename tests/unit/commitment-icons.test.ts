import { describe, expect, it } from "vitest"

import { inferCommitmentIcon } from "@/lib/budget/commitment-icons"

describe("commitment icon inference", () => {
  it.each([
    ["Hipoteca", "home"],
    ["Compra Mercadona", "shopping"],
    ["Guardería Teresa", "childcare"],
    ["Colegio Martin", "school"],
    ["Gasolina RAV4", "car"],
    ["Luz Iberdrola", "power"],
    ["Seguro hogar", "insurance"],
    ["Alarma Verisure", "security"],
    ["Fibra Movistar", "telecom"],
    ["Telefonía móvil", "telecom"],
    ["Family support", "support"],
  ])("infers %s as %s", (name, icon) => {
    expect(inferCommitmentIcon(name)).toBe(icon)
  })

  it("falls back to receipt for unknown names", () => {
    expect(inferCommitmentIcon("Something custom")).toBe("receipt")
  })
})
