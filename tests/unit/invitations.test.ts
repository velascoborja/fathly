import { beforeEach, describe, expect, it, vi } from "vitest"
import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  findUnique: vi.fn(),
  upsertInvite: vi.fn(),
  updateMany: vi.fn(),
  findMember: vi.fn(),
  findFirstMember: vi.fn(),
  upsertMember: vi.fn(),
  findUser: vi.fn(),
  lockUser: vi.fn(),
}))
vi.mock("@/server/household", () => ({ requireHouseholdPermission: mocks.permission }))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.en }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    householdInvitation: { findUnique: mocks.findUnique, upsert: mocks.upsertInvite, updateMany: mocks.updateMany },
    householdMember: { findFirst: mocks.findFirstMember },
  },
}))
vi.mock("@/server/transaction", () => ({
  serializableTransaction: async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      $queryRaw: mocks.lockUser,
      user: { findUniqueOrThrow: mocks.findUser },
      householdInvitation: { findUnique: mocks.findUnique, updateMany: mocks.updateMany },
      householdMember: { findUnique: mocks.findMember, upsert: mocks.upsertMember },
    }),
}))

import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  findInvitation,
  hashInvitationToken,
  invitationState,
} from "@/server/invitations"

const token = "a".repeat(43)
function invitation(overrides = {}) {
  return {
    id: "invite",
    householdId: "shared",
    email: "person@example.com",
    role: "VIEWER",
    tokenHash: hashInvitationToken(token),
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    cancelledAt: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.permission.mockResolvedValue({ user: { id: "owner", email: "owner@example.com" } })
  mocks.findUser.mockResolvedValue({ id: "person", email: "PERSON@example.com", emailVerified: new Date() })
  mocks.findUnique.mockResolvedValue(invitation())
  mocks.findFirstMember.mockResolvedValue(null)
  mocks.updateMany.mockResolvedValue({ count: 1 })
})

describe("creating invitations", () => {
  it("invites a new user without creating an account or membership and stores only the token hash", async () => {
    const result = await createInvitation("shared", "person@example.com", "EDITOR")
    const rawToken = result.invitationPath.split("/").at(-1)!
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(mocks.upsertInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId_email: { householdId: "shared", email: "person@example.com" } },
        create: expect.objectContaining({
          role: "EDITOR",
          tokenHash: hashInvitationToken(rawToken),
          acceptedAt: null,
          cancelledAt: null,
        }),
        update: expect.objectContaining({ role: "EDITOR", tokenHash: hashInvitationToken(rawToken) }),
      })
    )
    expect(JSON.stringify(mocks.upsertInvite.mock.calls)).not.toContain(rawToken)
    expect(new Date(result.expiresAt).getTime() - Date.now()).toBeGreaterThan(6.99 * 24 * 60 * 60 * 1000)
    expect(mocks.upsertMember).not.toHaveBeenCalled()
  })

  it("returns an error for self invitations and existing members", async () => {
    await expect(createInvitation("shared", "owner@example.com", "VIEWER")).rejects.toThrow(
      dictionaries.en.validation.shareAccessSelf
    )
    mocks.findFirstMember.mockResolvedValue({ id: "member" })
    await expect(createInvitation("shared", "person@example.com", "VIEWER")).rejects.toThrow(
      dictionaries.en.validation.shareAccessAlreadyMember
    )
    expect(mocks.upsertInvite).not.toHaveBeenCalled()
  })

  it("checks owner permission before creating or cancelling invitations", async () => {
    mocks.permission.mockRejectedValue(new Error("forbidden"))
    await expect(createInvitation("shared", "person@example.com", "VIEWER")).rejects.toThrow("forbidden")
    await expect(cancelInvitation("shared", "invite")).rejects.toThrow("forbidden")
    expect(mocks.upsertInvite).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("cancels only unaccepted invitations within the specified household", async () => {
    await cancelInvitation("shared", "invite")
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "invite", householdId: "shared", acceptedAt: null, cancelledAt: null } })
    )
  })
})

describe("accepting invitations", () => {
  it("consumes the invitation and joins the shared household without modifying existing memberships", async () => {
    expect(await acceptInvitation(token, "person")).toBe("shared")
    expect(mocks.upsertMember).toHaveBeenCalledWith({
      where: { householdId_userId: { householdId: "shared", userId: "person" } },
      create: { householdId: "shared", userId: "person", role: "VIEWER" },
      update: {},
    })
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenHash: hashInvitationToken(token), acceptedAt: null, cancelledAt: null }),
      })
    )
  })

  it.each([
    [null, "invalid"],
    [invitation({ cancelledAt: new Date() }), "cancelledLink"],
    [invitation({ expiresAt: new Date(0) }), "expired"],
    [invitation({ role: "OWNER" }), "invalid"],
  ])("rejects unavailable invitations", async (row, message) => {
    mocks.findUnique.mockResolvedValue(row)
    await expect(acceptInvitation(token, "person")).rejects.toThrow(dictionaries.en.sharing[message as "invalid"])
    expect(mocks.upsertMember).not.toHaveBeenCalled()
  })

  it("rejects a wrong email or unverified identity", async () => {
    mocks.findUser.mockResolvedValue({ email: "wrong@example.com", emailVerified: new Date() })
    await expect(acceptInvitation(token, "person")).rejects.toThrow(dictionaries.en.sharing.wrongAccount)
    mocks.findUser.mockResolvedValue({ email: "person@example.com", emailVerified: null })
    await expect(acceptInvitation(token, "person")).rejects.toThrow(dictionaries.en.sharing.verify)
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("does not create membership if a concurrent consume or regeneration wins", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })
    await expect(acceptInvitation(token, "person")).rejects.toThrow(dictionaries.en.sharing.invalid)
    expect(mocks.upsertMember).not.toHaveBeenCalled()
  })

  it("treats repeated acceptance as success only while the recipient is still a member", async () => {
    mocks.findUnique.mockResolvedValue(invitation({ acceptedAt: new Date() }))
    mocks.findMember.mockResolvedValue({ role: "EDITOR" })
    expect(await acceptInvitation(token, "person")).toBe("shared")
    expect(mocks.upsertMember).not.toHaveBeenCalled()
    mocks.findMember.mockResolvedValue(null)
    await expect(acceptInvitation(token, "person")).rejects.toThrow(dictionaries.en.sharing.used)
  })

  it("rejects malformed links without a database lookup", async () => {
    expect(await findInvitation("short")).toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("expires links exactly at their deadline", () => {
    const now = new Date()
    expect(invitationState(invitation({ expiresAt: now }), now)).toBe("expired")
  })
})
