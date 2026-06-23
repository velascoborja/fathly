import { beforeEach, describe, expect, it, vi } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  getActiveHouseholdContext: vi.fn(),
  getServerDictionary: vi.fn(),
  revalidatePath: vi.fn(),
  updateMany: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("@/lib/i18n/server", () => ({
  getServerDictionary: mocks.getServerDictionary,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    commitment: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
  },
}))

vi.mock("@/server/household", () => ({
  getActiveHouseholdContext: mocks.getActiveHouseholdContext,
}))

function formData(category: string) {
  const data = new FormData()
  data.set("category", category)
  return data
}

describe("renameCommitmentCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getServerDictionary.mockResolvedValue(dictionaries.es)
    mocks.getActiveHouseholdContext.mockResolvedValue({
      household: { id: "household-1" },
      plan: { id: "plan-1" },
    })
    mocks.findFirst.mockResolvedValue(null)
    mocks.updateMany.mockResolvedValue({ count: 2 })
  })

  it("rejects empty category names", async () => {
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("Casa", formData(""))).rejects.toThrow("La categoría es obligatoria.")
    expect(mocks.getActiveHouseholdContext).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("rejects unchanged names after trimming", async () => {
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("Casa", formData(" Casa "))).rejects.toThrow(
      "El nombre de la categoría no ha cambiado."
    )
    expect(mocks.getActiveHouseholdContext).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("rejects duplicate category names in the active plan", async () => {
    mocks.findFirst.mockResolvedValue({ id: "commitment-2" })
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("Casa", formData("Suministros"))).rejects.toThrow(
      "Ya existe una categoría con ese nombre."
    )
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        householdId: "household-1",
        planId: "plan-1",
        category: {
          equals: "Suministros",
          mode: "insensitive",
        },
        NOT: {
          category: "Casa",
        },
      },
      select: {
        id: true,
      },
    })
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("renames every matching commitment in the active plan", async () => {
    const { renameCommitmentCategory } = await import("@/server/actions")

    await renameCommitmentCategory("Casa", formData("Hogar"))

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-1",
        planId: "plan-1",
        category: "Casa",
      },
      data: {
        category: "Hogar",
      },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
  })
})
