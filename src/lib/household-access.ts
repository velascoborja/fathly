import type { HouseholdRole } from "@prisma/client"

export function canEditBudget(role: HouseholdRole) {
  return role === "OWNER" || role === "EDITOR"
}

export function safeReturnTo(value: unknown): string {
  return typeof value === "string" && /^\/invite\/[A-Za-z0-9_-]{43}$/.test(value) ? value : "/dashboard"
}

export function selectHousehold<T extends { householdId: string }>(memberships: T[], selectedId?: string) {
  return memberships.find((membership) => membership.householdId === selectedId) ?? memberships[0]
}
