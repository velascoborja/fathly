import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextAuthConfig } from "next-auth"

const mocks = vi.hoisted(() => ({
  config: null as NextAuthConfig | null,
  updateUser: vi.fn(),
  deleteSessions: vi.fn(),
}))
vi.mock("next-auth", () => ({
  default: (config: NextAuthConfig) => {
    mocks.config = config
    return {}
  },
}))
vi.mock("next-auth/providers/google", () => ({ default: () => ({ id: "google" }) }))
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }))
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: mocks.updateUser }, session: { deleteMany: mocks.deleteSessions } },
}))
import "@/auth"

beforeEach(() => vi.clearAllMocks())

describe("Google invitation identity", () => {
  it("requires the verified email claim before allowing Google sign-in", async () => {
    const callback = mocks.config!.callbacks!.signIn!
    const account = { provider: "google", type: "oidc" as const, providerAccountId: "google-user" }
    const user = { id: "user", email: "person@example.com" }
    expect(await callback({ user, account, profile: { email: "person@example.com", email_verified: true } })).toBe(true)
    expect(await callback({ user, account, profile: { email: "person@example.com", email_verified: false } })).toBe(
      false
    )
    expect(await callback({ user, account, profile: { email: "person@example.com" } })).toBe(false)
  })

  it("persists the current verified Google email for acceptance, rather than trusting a stale profile email", async () => {
    await mocks.config!.events!.signIn!({
      user: { id: "user", email: "old@example.com" },
      account: { provider: "google", type: "oidc", providerAccountId: "google-user" },
      profile: { email: " PERSON@example.com ", email_verified: true },
    })
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: "user" },
      data: { email: "person@example.com", emailVerified: expect.any(Date) },
    })
  })

  it("does not mark unverified Google emails as verified", async () => {
    await mocks.config!.events!.signIn!({
      user: { id: "user" },
      account: { provider: "google", type: "oidc", providerAccountId: "google-user" },
      profile: { email: "person@example.com", email_verified: false },
    })
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it("handles sign-out after account deletion has already removed its sessions", async () => {
    await mocks.config!.adapter!.deleteSession!("already-deleted-session")
    expect(mocks.deleteSessions).toHaveBeenCalledWith({ where: { sessionToken: "already-deleted-session" } })
  })
})
