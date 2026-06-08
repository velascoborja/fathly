import type { CommitmentType, FinancialItemStatus, Frequency } from "@prisma/client"

export type BudgetDeposit = {
  amountCents: number
  status: FinancialItemStatus
}

export type BudgetCommitment = {
  amountCents: number
  category: string
  frequency: Frequency
  status: FinancialItemStatus
  type: CommitmentType
}

export function monthlyAmountCents(item: Pick<BudgetCommitment, "amountCents" | "frequency">) {
  return item.frequency === "ANNUAL" ? Math.round(item.amountCents / 12) : item.amountCents
}

export function calculateBudgetSummary(deposits: BudgetDeposit[], commitments: BudgetCommitment[]) {
  const activeDeposits = deposits.filter((deposit) => deposit.status === "ACTIVE")
  const activeCommitments = commitments.filter((commitment) => commitment.status === "ACTIVE")

  const monthlyDepositsCents = activeDeposits.reduce((sum, deposit) => sum + deposit.amountCents, 0)
  const monthlyCommitmentsCents = activeCommitments.reduce(
    (sum, commitment) => sum + monthlyAmountCents(commitment),
    0
  )
  const annualProratedCents = activeCommitments
    .filter((commitment) => commitment.frequency === "ANNUAL")
    .reduce((sum, commitment) => sum + monthlyAmountCents(commitment), 0)
  const savingsCents = activeCommitments
    .filter((commitment) => commitment.type === "SAVINGS")
    .reduce((sum, commitment) => sum + monthlyAmountCents(commitment), 0)

  return {
    monthlyDepositsCents,
    monthlyCommitmentsCents,
    annualProratedCents,
    savingsCents,
    coverageCents: monthlyDepositsCents - monthlyCommitmentsCents,
    coverageRatio:
      monthlyDepositsCents === 0
        ? 0
        : Math.min(monthlyCommitmentsCents / monthlyDepositsCents, 1),
  }
}

export function groupCommitmentsByCategory(commitments: BudgetCommitment[]) {
  return commitments
    .filter((commitment) => commitment.status === "ACTIVE")
    .reduce<Record<string, number>>((groups, commitment) => {
      groups[commitment.category] = (groups[commitment.category] ?? 0) + monthlyAmountCents(commitment)
      return groups
    }, {})
}
