import { beforeEach, describe, expect, it, vi } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  requireHouseholdPermission: vi.fn(),
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
  requireHouseholdPermission: mocks.requireHouseholdPermission,
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
    mocks.requireHouseholdPermission.mockResolvedValue({
      household: { id: "household-1" },
      plan: { id: "plan-1" },
    })
    mocks.findFirst.mockResolvedValue(null)
    mocks.updateMany.mockResolvedValue({ count: 2 })
  })

  it("rejects empty category names", async () => {
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("household-1", "Casa", formData(""))).rejects.toThrow("La categoría es obligatoria.")
    expect(mocks.requireHouseholdPermission).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("rejects unchanged names after trimming", async () => {
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("household-1", "Casa", formData(" Casa "))).rejects.toThrow(
      "El nombre de la categoría no ha cambiado."
    )
    expect(mocks.requireHouseholdPermission).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("rejects duplicate category names in the active plan", async () => {
    mocks.findFirst.mockResolvedValue({ id: "commitment-2" })
    const { renameCommitmentCategory } = await import("@/server/actions")

    await expect(renameCommitmentCategory("household-1", "Casa", formData("Suministros"))).rejects.toThrow(
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

    await renameCommitmentCategory("household-1", "Casa", formData("Hogar"))

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

describe("moveCommitmentCategory", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getServerDictionary.mockResolvedValue(dictionaries.es)
    mocks.requireHouseholdPermission.mockResolvedValue({
      household: { id: "household-1" },
      plan: { id: "plan-1" },
    })
    mocks.findFirst.mockImplementation(({ where }: { where: { id?: string } }) =>
      Promise.resolve(where.id ? { category: "Casa" } : { id: "target" })
    )
    mocks.updateMany.mockResolvedValue({ count: 1 })
  })

  it.each(["", "   ", "a".repeat(61)])("rejects invalid target categories (%s)", async (category) => {
    const { moveCommitmentCategory } = await import("@/server/actions")

    await expect(moveCommitmentCategory("household-1", "bill", category)).rejects.toThrow()
    expect(mocks.requireHouseholdPermission).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("checks edit access before reading or changing a commitment", async () => {
    mocks.requireHouseholdPermission.mockRejectedValue(new Error("FORBIDDEN"))
    const { moveCommitmentCategory } = await import("@/server/actions")

    await expect(moveCommitmentCategory("household-1", "bill", "Suministros")).rejects.toThrow("FORBIDDEN")
    expect(mocks.requireHouseholdPermission).toHaveBeenCalledWith("household-1", "edit")
    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("scopes the expense and destination to active items in the authorized household and plan", async () => {
    const { moveCommitmentCategory } = await import("@/server/actions")

    await moveCommitmentCategory("household-1", "bill", " Suministros ")

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { householdId: "household-1", planId: "plan-1", status: "ACTIVE", id: "bill" },
      select: { category: true },
    })
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { householdId: "household-1", planId: "plan-1", status: "ACTIVE", category: "Suministros" },
      select: { id: true },
    })
    expect(mocks.updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { householdId: "household-1", planId: "plan-1", status: "ACTIVE", id: "bill", category: "Casa" },
      data: { category: "Suministros" },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/checkpoints", "layout")
  })

  it("ignores moves to the current category", async () => {
    const { moveCommitmentCategory } = await import("@/server/actions")

    await moveCommitmentCategory("household-1", "bill", " Casa ")

    expect(mocks.updateMany).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects missing expenses, including expenses outside the authorized scope", async () => {
    mocks.findFirst.mockResolvedValueOnce(null)
    const { moveCommitmentCategory } = await import("@/server/actions")

    await expect(moveCommitmentCategory("household-1", "other-plan-bill", "Suministros")).rejects.toThrow(
      dictionaries.es.validation.genericCommitmentInvalid
    )
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("rejects destinations that disappeared or only exist outside the authorized scope", async () => {
    mocks.findFirst.mockResolvedValueOnce({ category: "Casa" }).mockResolvedValueOnce(null)
    const { moveCommitmentCategory } = await import("@/server/actions")

    await expect(moveCommitmentCategory("household-1", "bill", "Other plan category")).rejects.toThrow(
      dictionaries.es.validation.categoryUnavailable
    )
    expect(mocks.updateMany).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("does not report success when the expense was deleted or changed before saving", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })
    const { moveCommitmentCategory } = await import("@/server/actions")

    await expect(moveCommitmentCategory("household-1", "bill", "Suministros")).rejects.toThrow(
      dictionaries.es.actions.moveCommitmentError
    )
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
