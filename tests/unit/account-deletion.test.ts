import { beforeEach, describe, expect, it, vi } from "vitest"
import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  memberships: vi.fn(),
  update: vi.fn(),
  deleteHousehold: vi.fn(),
  deleteUser: vi.fn(),
}))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.en }))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/server/household", () => ({ requireUser: vi.fn() }))
vi.mock("@/server/transaction", () => ({
  serializableTransaction: async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      householdMember: { findMany: mocks.memberships, update: mocks.update },
      household: { delete: mocks.deleteHousehold },
      user: { delete: mocks.deleteUser },
    }),
}))
import { deleteAccountData } from "@/server/account"

beforeEach(() => vi.resetAllMocks())

describe("account deletion ownership", () => {
  it("requires an explicit valid successor in every shared household where the user is the last owner", async () => {
    mocks.memberships
      .mockResolvedValueOnce([
        { householdId: "a", role: "OWNER" },
        { householdId: "b", role: "OWNER" },
      ])
      .mockResolvedValueOnce([{ id: "member-a", role: "EDITOR" }])
      .mockResolvedValueOnce([{ id: "member-b", role: "VIEWER" }])
    await expect(deleteAccountData("owner", { a: "member-a", b: "foreign-member" })).rejects.toThrow(
      dictionaries.en.sharing.successorRequired
    )
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it("transfers only to the explicitly selected remaining members before deleting the user", async () => {
    mocks.memberships
      .mockResolvedValueOnce([
        { householdId: "a", role: "OWNER" },
        { householdId: "b", role: "OWNER" },
      ])
      .mockResolvedValueOnce([
        { id: "editor", role: "EDITOR" },
        { id: "viewer", role: "VIEWER" },
      ])
      .mockResolvedValueOnce([{ id: "member-b", role: "EDITOR" }])
    await deleteAccountData("owner", { a: "viewer", b: "member-b" })
    expect(mocks.update.mock.calls).toEqual([
      [{ where: { id: "viewer" }, data: { role: "OWNER" } }],
      [{ where: { id: "member-b" }, data: { role: "OWNER" } }],
    ])
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: "owner" } })
    expect(mocks.deleteHousehold).not.toHaveBeenCalled()
  })

  it("keeps shared budgets when another owner remains and deletes only empty households", async () => {
    mocks.memberships
      .mockResolvedValueOnce([
        { householdId: "shared", role: "OWNER" },
        { householdId: "personal", role: "OWNER" },
      ])
      .mockResolvedValueOnce([{ id: "owner-b", role: "OWNER" }])
      .mockResolvedValueOnce([])
    await deleteAccountData("owner", {})
    expect(mocks.deleteHousehold).toHaveBeenCalledExactlyOnceWith({ where: { id: "personal" } })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.deleteUser).toHaveBeenCalled()
  })
})
