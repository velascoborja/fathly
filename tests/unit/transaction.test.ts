import { beforeEach, describe, expect, it, vi } from "vitest"
import { Prisma } from "@prisma/client"

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }))
import { serializableTransaction } from "@/server/transaction"

beforeEach(() => vi.resetAllMocks())

function conflict(code: string, sqlState?: string) {
  return new Prisma.PrismaClientKnownRequestError("Transaction conflict", {
    code,
    clientVersion: "test",
    meta: sqlState ? { code: sqlState } : undefined,
  })
}

describe("serializable transaction retries", () => {
  it.each([
    ["P2034", undefined],
    ["P2010", "40001"],
    ["P2010", "40P01"],
  ])("retries %s (%s) without exposing a transient failure", async (code, sqlState) => {
    mocks.transaction.mockRejectedValueOnce(conflict(code!, sqlState)).mockResolvedValue("joined")
    expect(await serializableTransaction(async () => "joined")).toBe("joined")
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" })
  })

  it("does not retry validation or constraint failures", async () => {
    const error = conflict("P2002")
    mocks.transaction.mockRejectedValue(error)
    await expect(serializableTransaction(async () => null)).rejects.toBe(error)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })

  it("bounds retries and preserves the error when the database remains contended", async () => {
    const error = conflict("P2034")
    mocks.transaction.mockRejectedValue(error)
    await expect(serializableTransaction(async () => null)).rejects.toBe(error)
    expect(mocks.transaction).toHaveBeenCalledTimes(5)
  })
})
