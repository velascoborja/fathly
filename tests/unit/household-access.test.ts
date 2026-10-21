import { beforeEach, describe, expect, it, vi } from "vitest"
import type { HouseholdRole } from "@prisma/client"

import { canEditBudget, safeReturnTo, selectHousehold } from "@/lib/household-access"
import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  createPlan: vi.fn(),
  transaction: vi.fn(),
  lockUser: vi.fn(),
  findFirst: vi.fn(),
  createHousehold: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  cookies: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: mocks.auth }))
vi.mock("next/headers", () => ({ cookies: mocks.cookies }))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.en }))
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
  redirect: vi.fn(() => {
    throw new Error("REDIRECT")
  }),
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    householdMember: { findUnique: mocks.findUnique, findMany: mocks.findMany },
    budgetPlan: { create: mocks.createPlan },
    $transaction: mocks.transaction,
  },
}))

const plan = { id: "plan-a" }
function membership(role: HouseholdRole, householdId = "a") {
  return {
    id: `membership-${householdId}`,
    householdId,
    userId: "user",
    role,
    household: { id: householdId, name: householdId, budgetPlans: [plan] },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: "user", email: "user@example.com" } })
  mocks.cookies.mockResolvedValue({ get: () => ({ value: "b" }) })
  mocks.transaction.mockImplementation(async (work) =>
    work({
      $queryRaw: mocks.lockUser,
      householdMember: { findFirst: mocks.findFirst, findUniqueOrThrow: mocks.findUniqueOrThrow },
      household: { create: mocks.createHousehold },
    })
  )
})

describe("household permissions", () => {
  it("preserves the invitation when a session expires before acceptance", async () => {
    mocks.auth.mockResolvedValue(null)
    const { requireUser } = await import("@/server/household")
    const { redirect } = await import("next/navigation")
    const returnTo = `/invite/${"a".repeat(43)}`
    await expect(requireUser(returnTo)).rejects.toThrow("REDIRECT")
    expect(redirect).toHaveBeenCalledWith(`/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`)
  })

  it.each([
    ["OWNER", "edit", true],
    ["OWNER", "owner", true],
    ["EDITOR", "edit", true],
    ["EDITOR", "owner", false],
    ["VIEWER", "edit", false],
    ["VIEWER", "owner", false],
  ] as const)("checks %s permission for %s", async (role, permission, allowed) => {
    mocks.findUnique.mockResolvedValue(membership(role))
    const { requireHouseholdPermission } = await import("@/server/household")
    const result = requireHouseholdPermission("a", permission)
    if (allowed) expect((await result).household.id).toBe("a")
    else
      await expect(result).rejects.toThrow(
        permission === "owner" ? dictionaries.en.sharing.ownerOnly : dictionaries.en.sharing.forbidden
      )
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { householdId_userId: { householdId: "a", userId: "user" } } })
    )
    expect(mocks.createPlan).not.toHaveBeenCalled()
  })

  it("rejects a household outside the user's memberships", async () => {
    mocks.findUnique.mockResolvedValue(null)
    const { requireHouseholdPermission } = await import("@/server/household")
    await expect(requireHouseholdPermission("other", "edit")).rejects.toThrow(dictionaries.en.sharing.noAccess)
  })

  it("resolves an explicit write target independently of the active cookie", async () => {
    mocks.findUnique.mockResolvedValue(membership("EDITOR", "a"))
    const { requireHouseholdPermission } = await import("@/server/household")
    expect((await requireHouseholdPermission("a", "edit")).household.id).toBe("a")
    expect(mocks.cookies).not.toHaveBeenCalled()
  })

  it("uses only valid memberships when resolving the active household", async () => {
    mocks.findMany.mockResolvedValue([membership("OWNER", "a"), membership("VIEWER", "b")])
    const { getActiveHouseholdContext } = await import("@/server/household")
    expect((await getActiveHouseholdContext()).household.id).toBe("b")
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "intruder" }) })
    expect((await getActiveHouseholdContext()).household.id).toBe("a")
  })

  it("does not provision plans while viewing as a viewer", async () => {
    const row = membership("VIEWER")
    row.household.budgetPlans = []
    mocks.findMany.mockResolvedValue([row])
    const { getActiveHouseholdContext } = await import("@/server/household")
    await expect(getActiveHouseholdContext()).rejects.toThrow("NOT_FOUND")
    expect(mocks.createPlan).not.toHaveBeenCalled()
  })

  it("reuses an unshared household on repeated sign-ins, including missing or stale selections", async () => {
    const existing = membership("OWNER")
    mocks.findMany.mockResolvedValue([existing])
    const { getActiveHouseholdContext } = await import("@/server/household")
    for (const selectedId of [undefined, "a", "deleted-household", "other-users-household"]) {
      mocks.cookies.mockResolvedValue({ get: () => (selectedId ? { value: selectedId } : undefined) })
      const context = await getActiveHouseholdContext()
      expect(context.household.id).toBe("a")
      expect(context.memberships).toEqual([existing])
    }
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.createHousehold).not.toHaveBeenCalled()
    expect(mocks.createPlan).not.toHaveBeenCalled()
  })

  it("rechecks membership after locking the user when another first visit already provisioned it", async () => {
    mocks.findMany.mockResolvedValue([])
    const existing = membership("OWNER")
    mocks.findFirst.mockResolvedValue(existing)
    const { getActiveHouseholdContext } = await import("@/server/household")
    const context = await getActiveHouseholdContext()
    expect(context.household.id).toBe("a")
    expect(context.memberships).toEqual([existing])
    expect(mocks.lockUser).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining("FOR UPDATE")]), "user")
    expect(mocks.lockUser.mock.invocationCallOrder[0]).toBeLessThan(mocks.findFirst.mock.invocationCallOrder[0])
    expect(mocks.createHousehold).not.toHaveBeenCalled()
  })

  it("creates the first household and its owner membership only inside the user lock", async () => {
    mocks.findMany.mockResolvedValue([])
    mocks.findFirst.mockResolvedValue(null)
    mocks.createHousehold.mockResolvedValue({ id: "a" })
    mocks.findUniqueOrThrow.mockResolvedValue(membership("OWNER"))
    const { getActiveHouseholdContext } = await import("@/server/household")
    expect((await getActiveHouseholdContext()).memberships).toHaveLength(1)
    expect(mocks.createHousehold).toHaveBeenCalledTimes(1)
    expect(mocks.createHousehold).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ members: { create: { userId: "user", role: "OWNER" } } }),
      })
    )
    expect(mocks.lockUser.mock.invocationCallOrder[0]).toBeLessThan(mocks.findFirst.mock.invocationCallOrder[0])
    expect(mocks.findFirst.mock.invocationCallOrder[0]).toBeLessThan(mocks.createHousehold.mock.invocationCallOrder[0])
  })
})

describe("selection and return destinations", () => {
  it("falls back to the first membership for missing or forged selections", () => {
    const memberships = [{ householdId: "a" }, { householdId: "b" }]
    expect(selectHousehold(memberships, "other")).toBe(memberships[0])
    expect(selectHousehold(memberships, "b")).toBe(memberships[1])
    expect(selectHousehold([])).toBeUndefined()
  })

  it("permits only invitation return paths", () => {
    const path = `/invite/${"a".repeat(43)}`
    expect(safeReturnTo(path)).toBe(path)
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/invite/short",
      path + "?next=evil",
      undefined,
      new FormData(),
    ]) {
      expect(safeReturnTo(value)).toBe("/dashboard")
    }
  })

  it("fails closed for unknown budget roles", () => {
    expect(canEditBudget("VIEWER")).toBe(false)
    expect(canEditBudget("invalid" as HouseholdRole)).toBe(false)
  })
})
