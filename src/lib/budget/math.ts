import type { CommitmentAmountMode, FinancialItemStatus, Frequency } from "@prisma/client"

export type BudgetDeposit = {
  amountCents: number
  status: FinancialItemStatus
}

export type BudgetCommitment = {
  amountCents: number | null
  amountMode?: CommitmentAmountMode
  category: string
  frequency: Frequency
  parts?: { amountCents: number }[]
  status: FinancialItemStatus
}

export type BudgetCommitmentBreakdown<T extends BudgetCommitment> = T & {
  monthlyAmountCents: number
}

export const DEFAULT_LOW_MONTHLY_MARGIN_BASIS_POINTS = 500

export function commitmentAmountCents(
  item: Pick<BudgetCommitment, "amountCents" | "amountMode" | "parts">
) {
  if (item.amountMode === "ITEMIZED" || item.amountCents === null) {
    return (item.parts ?? []).reduce((sum, part) => sum + part.amountCents, 0)
  }

  return item.amountCents
}

export function monthlyAmountCents(
  item: Pick<BudgetCommitment, "amountCents" | "amountMode" | "frequency" | "parts">
) {
  const amountCents = commitmentAmountCents(item)
  return item.frequency === "ANNUAL" ? Math.round(amountCents / 12) : amountCents
}

export function getLowMonthlyMarginCents(
  monthlyDepositsCents: number,
  lowMonthlyMarginBasisPoints = DEFAULT_LOW_MONTHLY_MARGIN_BASIS_POINTS
) {
  return Math.round(monthlyDepositsCents * (lowMonthlyMarginBasisPoints / 10_000))
}

export function formatLowMonthlyMarginPercent(lowMonthlyMarginBasisPoints: number) {
  const percentage = lowMonthlyMarginBasisPoints / 100

  return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`
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
  return {
    monthlyDepositsCents,
    monthlyCommitmentsCents,
    annualProratedCents,
    coverageCents: monthlyDepositsCents - monthlyCommitmentsCents,
    coverageRatio:
      monthlyDepositsCents === 0
        ? 0
        : Math.min(monthlyCommitmentsCents / monthlyDepositsCents, 1),
  }
}

export function getMonthlyResultTone({
  coverageCents,
  lowMonthlyMarginBasisPoints = DEFAULT_LOW_MONTHLY_MARGIN_BASIS_POINTS,
  monthlyDepositsCents,
}: Pick<ReturnType<typeof calculateBudgetSummary>, "coverageCents" | "monthlyDepositsCents"> & {
  lowMonthlyMarginBasisPoints?: number
}) {
  if (coverageCents < 0) {
    return "shortfall"
  }

  if (
    monthlyDepositsCents > 0 &&
    coverageCents <= getLowMonthlyMarginCents(monthlyDepositsCents, lowMonthlyMarginBasisPoints)
  ) {
    return "warning"
  }

  return "surplus"
}

export function groupCommitmentsByCategory(commitments: BudgetCommitment[]) {
  return commitments
    .filter((commitment) => commitment.status === "ACTIVE")
    .reduce<Record<string, number>>((groups, commitment) => {
      groups[commitment.category] = (groups[commitment.category] ?? 0) + monthlyAmountCents(commitment)
      return groups
    }, {})
}

export function getCommitmentBreakdown<T extends BudgetCommitment>(commitments: T[]): BudgetCommitmentBreakdown<T>[] {
  return commitments
    .filter((commitment) => commitment.status === "ACTIVE")
    .map((commitment) => ({
      ...commitment,
      monthlyAmountCents: monthlyAmountCents(commitment),
    }))
    .sort((a, b) => b.monthlyAmountCents - a.monthlyAmountCents)
}

export function groupCommitmentsForTable<T extends BudgetCommitment>(commitments: T[]) {
  const groups = new Map<string, { category: string; totalCents: number; commitments: T[] }>()

  for (const commitment of commitments) {
    const group = groups.get(commitment.category) ?? {
      category: commitment.category,
      totalCents: 0,
      commitments: [],
    }

    group.totalCents += monthlyAmountCents(commitment)
    group.commitments.push(commitment)
    groups.set(commitment.category, group)
  }

  return Array.from(groups.values())
}
