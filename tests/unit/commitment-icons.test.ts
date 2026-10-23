import { describe, expect, it } from "vitest"

import { commitmentIconOptions, getCommitmentIconOption, inferCommitmentIcon } from "@/lib/budget/commitment-icons"

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
    ["Viajes", "travel"],
    ["Vacaciones Caribe", "travel"],
    ["Vuelo Madrid", "travel"],
    ["Summer holiday", "travel"],
    ["Travel fund", "travel"],
    ["GIMNASIO", "gym"],
    ["Gym membership", "gym"],
    ["Fitness", "gym"],
    ["Música", "music"],
    ["Music lessons", "music"],
    ["Suscripción Spotify", "music"],
    ["Suscripción Netflix", "movies"],
    ["Películas", "movies"],
    ["Cine", "movies"],
    ["Movie tickets", "movies"],
    ["Film rental", "movies"],
    ["Suscripción anual", "subscriptions"],
    ["Cloud subscription", "subscriptions"],
    ["iCloud", "subscriptions"],
    ["Dropbox", "subscriptions"],
    ["Moto", "motorbike"],
    ["Motorbike fuel", "motorbike"],
    ["Motorcycle parking", "motorbike"],
    ["Taller coche", "maintenance"],
    ["Reparación moto", "maintenance"],
    ["Mantenimiento coche", "maintenance"],
    ["Home repair", "maintenance"],
    ["Vehicle maintenance", "maintenance"],
    ["Seguro moto", "insurance"],
    ["Motorbike insurance", "insurance"],
    ["Seguro viaje", "insurance"],
    ["Ocio", "leisure"],
  ])("infers %s as %s", (name, icon) => {
    expect(inferCommitmentIcon(name)).toBe(icon)
  })

  it("falls back to receipt for unknown names", () => {
    expect(inferCommitmentIcon("Something custom")).toBe("receipt")
  })
})

describe("commitment icon lookup", () => {
  it.each(["unknown", "", null, undefined])("falls back to receipt for %s", (value) => {
    expect(getCommitmentIconOption(value).value).toBe("receipt")
  })

  it("keeps the existing car option unique and receipt last", () => {
    expect(commitmentIconOptions.filter((option) => option.value === "car")).toHaveLength(1)
    expect(commitmentIconOptions.at(-1)?.value).toBe("receipt")
  })
})
