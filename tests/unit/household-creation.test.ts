import { beforeEach, describe, expect, it, vi } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  create: vi.fn(),
  setActiveHousehold: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("@/server/household", () => ({
  requireUser: mocks.requireUser,
  requireHouseholdPermission: vi.fn(),
  setActiveHousehold: mocks.setActiveHousehold,
}))
vi.mock("@/server/invitations", () => ({
  acceptInvitation: vi.fn(), cancelInvitation: vi.fn(), createInvitation: vi.fn(),
}))
vi.mock("@/lib/prisma", () => ({ prisma: { household: { create: mocks.create } } }))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.es }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))

import { createHousehold } from "@/server/household-actions"

function form(name?: string) {
  const data = new FormData()
  if (name !== undefined) data.set("name", name)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireUser.mockResolvedValue({ id: "user" })
  mocks.create.mockResolvedValue({ id: "new-household" })
  mocks.redirect.mockImplementation(() => { throw new Error("REDIRECT") })
})

describe("household creation", () => {
  it("requires authentication before creating or selecting a household", async () => {
    mocks.requireUser.mockRejectedValue(new Error("SIGN_IN"))
    await expect(createHousehold(form("Otra cuenta"))).rejects.toThrow("SIGN_IN")
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.setActiveHousehold).not.toHaveBeenCalled()
  })

  it.each([undefined, "", "   ", "a".repeat(81)])("rejects invalid names: %s", async (name) => {
    expect(await createHousehold(form(name))).toEqual({ error: dictionaries.es.validation.genericHouseholdNameInvalid })
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.setActiveHousehold).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it("atomically creates an owner and an empty active plan with onboarding completed, then activates it", async () => {
    const data = form("  Otra cuenta  ")
    data.set("userId", "someone-else")
    data.set("role", "VIEWER")
    await expect(createHousehold(data)).rejects.toThrow("REDIRECT")
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        name: "Otra cuenta",
        members: { create: { userId: "user", role: "OWNER" } },
        budgetPlans: {
          create: { name: dictionaries.es.activePlanName, status: "ACTIVE", onboardingCompletedAt: expect.any(Date) },
        },
      },
      select: { id: true },
    })
    expect(mocks.setActiveHousehold).toHaveBeenCalledExactlyOnceWith("new-household")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout")
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard")
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(mocks.setActiveHousehold.mock.invocationCallOrder[0])
    expect(mocks.setActiveHousehold.mock.invocationCallOrder[0]).toBeLessThan(mocks.revalidatePath.mock.invocationCallOrder[0])
  })

  it("returns a localized error on a failed nested write without changing the active household", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      mocks.create.mockRejectedValue(new Error("private database details"))
      expect(await createHousehold(form("Otra cuenta"))).toEqual({ error: dictionaries.es.sharing.createHouseholdError })
      expect(mocks.setActiveHousehold).not.toHaveBeenCalled()
      expect(mocks.revalidatePath).not.toHaveBeenCalled()
      expect(mocks.redirect).not.toHaveBeenCalled()
    } finally {
      logger.mockRestore()
    }
  })
})
