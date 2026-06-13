import { describe, expect, it } from "vitest"

import { normalizeDatabaseUrl } from "@/lib/database-url"

describe("database url", () => {
  it("uses explicit verify-full ssl mode for current pg behavior", () => {
    expect(normalizeDatabaseUrl("postgresql://user:password@host:5432/fathly?sslmode=require")).toBe(
      "postgresql://user:password@host:5432/fathly?sslmode=verify-full"
    )
  })

  it("preserves existing query parameters while normalizing ssl mode", () => {
    expect(normalizeDatabaseUrl("postgresql://user:password@host:5432/fathly?schema=public&sslmode=prefer")).toBe(
      "postgresql://user:password@host:5432/fathly?schema=public&sslmode=verify-full"
    )
  })

  it("leaves explicit libpq compatibility mode unchanged", () => {
    expect(
      normalizeDatabaseUrl("postgresql://user:password@host:5432/fathly?uselibpqcompat=true&sslmode=require")
    ).toBe("postgresql://user:password@host:5432/fathly?uselibpqcompat=true&sslmode=require")
  })
})
