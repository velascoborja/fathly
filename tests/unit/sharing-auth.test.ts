import { beforeEach, describe, expect, it, vi } from "vitest"
import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), deleteCookie: vi.fn() }))
vi.mock("@/auth", () => ({ auth: mocks.auth, signIn: mocks.signIn, signOut: mocks.signOut }))
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: mocks.deleteCookie }) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/server/household", () => ({ requireUser: vi.fn(), requireHouseholdPermission: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.en }))
import { signInWithGoogle, signOutUser } from "@/server/actions"

beforeEach(() => vi.resetAllMocks())

describe("invitation sign-in", () => {
  it("ends the existing session before switching Google accounts, avoiding linking the new identity to the signed-in user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "wrong-user" } })
    const returnTo = `/invite/${"a".repeat(43)}`
    const formData = new FormData()
    formData.set("returnTo", returnTo)
    await signInWithGoogle(formData)
    expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false })
    expect(mocks.signIn).toHaveBeenCalledWith("google", { redirectTo: returnTo }, { prompt: "select_account" })
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeLessThan(mocks.signIn.mock.invocationCallOrder[0])
    expect(mocks.deleteCookie).toHaveBeenCalledWith("fathly-household")
  })

  it("retains the normal dashboard destination and rejects external destinations", async () => {
    mocks.auth.mockResolvedValue(null)
    const formData = new FormData()
    formData.set("returnTo", "https://evil.example")
    await signInWithGoogle(formData)
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(mocks.signIn).toHaveBeenCalledWith("google", { redirectTo: "/dashboard" }, { prompt: "select_account" })
  })

  it("clears household selection on sign-out", async () => {
    await signOutUser()
    expect(mocks.deleteCookie).toHaveBeenCalledWith("fathly-household")
    expect(mocks.signOut).toHaveBeenCalledWith({ redirectTo: "/auth/signin" })
  })
})
