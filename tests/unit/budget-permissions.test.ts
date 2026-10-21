import { beforeEach, describe, expect, it, vi } from "vitest"
import { dictionaries } from "@/lib/i18n/dictionaries"

const mocks = vi.hoisted(() => ({ permission: vi.fn() }))
vi.mock("@/server/household", () => ({ requireHouseholdPermission: mocks.permission }))
vi.mock("@/lib/i18n/server", () => ({ getServerDictionary: async () => dictionaries.en }))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))

import * as actions from "@/server/actions"

function data(values: Record<string, string>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) form.set(key, value)
  return form
}

const deposit = () => data({ name: "Salary", amount: "100" })
const commitment = () => data({ name: "Rent", amount: "50", category: "House", frequency: "MONTHLY" })
const cases = [
  ["create deposit", "edit", () => actions.createDeposit("rendered-household", deposit())],
  ["update deposit", "edit", () => actions.updateDeposit("rendered-household", "deposit", deposit())],
  ["delete deposit", "edit", () => actions.deleteDeposit("rendered-household", "deposit")],
  ["create commitment", "edit", () => actions.createCommitment("rendered-household", commitment())],
  ["update commitment", "edit", () => actions.updateCommitment("rendered-household", "bill", commitment())],
  ["delete commitment", "edit", () => actions.deleteCommitment("rendered-household", "bill")],
  [
    "rename category",
    "edit",
    () => actions.renameCommitmentCategory("rendered-household", "House", data({ category: "Utilities" })),
  ],
  ["create checkpoint", "edit", () => actions.createCheckpoint("rendered-household", data({ name: "Snapshot" }))],
  ["delete checkpoint", "edit", () => actions.deleteCheckpoint("rendered-household", "checkpoint")],
  [
    "complete setup",
    "edit",
    () =>
      actions.completeInitialSetup(
        "rendered-household",
        data({ depositName: "Salary", depositAmount: "100", monthlyBillName: "Rent", monthlyBillAmount: "50" })
      ),
  ],
  ["rename household", "owner", () => actions.updateHouseholdName("rendered-household", data({ name: "Family" }))],
  [
    "update budget settings",
    "owner",
    () => actions.updatePlanSettings("rendered-household", data({ lowMonthlyMarginPercent: "5" })),
  ],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  mocks.permission.mockRejectedValue(new Error("FORBIDDEN"))
})

describe("budget mutation authorization", () => {
  it.each(cases)("checks permission and the rendered household before %s", async (_, permission, invoke) => {
    await expect(invoke()).rejects.toThrow("FORBIDDEN")
    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("rendered-household", permission)
  })
})
