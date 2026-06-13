import {
  ActivityIcon,
  AlertTriangleIcon,
  CircleDollarSignIcon,
  PlugZapIcon,
  ZapIcon,
} from "lucide-react"
import type { Commitment, Deposit } from "@prisma/client"
import { Fragment } from "react"

import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { BudgetRowActions, BudgetRowContextMenu } from "@/components/budget/budget-row-actions"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import {
  calculateBudgetSummary,
  formatLowMonthlyMarginPercent,
  getCommitmentBreakdown,
  getLowMonthlyMarginCents,
  getMonthlyResultTone,
  groupCommitmentsForTable,
} from "@/lib/budget/math"
import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
import { formatBudgetUsagePercent, formatWholeCurrency } from "@/lib/budget/format"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import {
  createCommitment,
  createDeposit,
  deleteCommitment,
  deleteDeposit,
  updateCommitment,
  updateDeposit,
} from "@/server/actions"
import { getBudgetData } from "@/server/household"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

export const dynamic = "force-dynamic"

type Dictionary = (typeof dictionaries)[Locale]

export default async function DashboardPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const summary = calculateBudgetSummary(data.deposits, data.commitments)
  const outflows = getCommitmentBreakdown(data.commitments)
  const hasData = data.deposits.length > 0 || data.commitments.length > 0

  return (
    <>
      <section className="fathly-hero flex flex-col gap-6 p-5 md:p-6">
        <DashboardHeader dictionary={dictionary} />

        <MonthlySnapshot
          dictionary={dictionary}
          hasData={hasData}
          locale={locale}
          lowMonthlyMarginBasisPoints={data.plan.lowMonthlyMarginBasisPoints}
          summary={summary}
        />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.9fr)]">
          <div className="grid gap-4">
            <IncomePanel deposits={data.deposits} dictionary={dictionary} locale={locale} />
            <Card className="fathly-card">
              <CardHeader>
                <CardTitle className="text-2xl">{dictionary.dashboard.breakdown}</CardTitle>
                <CardDescription>{dictionary.dashboard.liveUpdateHint}</CardDescription>
              </CardHeader>
              <CardContent>
                <CommitmentChart
                  data={outflows.map((outflow) => ({
                    amountCents: outflow.monthlyAmountCents,
                    id: outflow.id,
                    name: outflow.name,
                  }))}
                  locale={locale}
                  wholeCurrency
                />
              </CardContent>
            </Card>
          </div>

          <Card className="fathly-card border-destructive/35">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <ActivityIcon className="size-5 text-destructive" />
                    {dictionary.dashboard.monthOutflows}
                  </CardTitle>
                  <CardDescription>{dictionary.dashboard.outflowsBody}</CardDescription>
                </div>
                <BudgetDialogForm action={createCommitment} dictionary={dictionary} kind="commitment" />
              </div>
            </CardHeader>
            <CardContent>
              <OutflowTable commitments={outflows} dictionary={dictionary} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </section>

      {!hasData && (
        <Card className="fathly-card fathly-alert">
          <CardContent className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{dictionary.dashboard.emptyTitle}</EmptyTitle>
                <EmptyDescription>{dictionary.dashboard.emptyBody}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function DashboardHeader({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">{dictionary.dashboard.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{dictionary.dashboard.subtitle}</p>
    </div>
  )
}

function MonthlySnapshot({
  dictionary,
  hasData,
  locale,
  lowMonthlyMarginBasisPoints,
  summary,
}: {
  dictionary: Dictionary
  hasData: boolean
  locale: Locale
  lowMonthlyMarginBasisPoints: number
  summary: ReturnType<typeof calculateBudgetSummary>
}) {
  const resultTone = hasData ? getMonthlyResultTone({ ...summary, lowMonthlyMarginBasisPoints }) : "surplus"
  const short = resultTone === "shortfall"
  const resultAmount = hasData
    ? `${short ? "-" : "+"}${formatWholeCurrency(Math.abs(summary.coverageCents), locale)}`
    : formatWholeCurrency(0, locale)
  const resultDescription = !hasData
    ? dictionary.dashboard.monthlyResultEmpty
    : short
      ? dictionary.dashboard.monthlyResultShortfall
      : dictionary.dashboard.monthlyResultSurplus

  const cardToneClass =
    resultTone === "shortfall"
      ? "fathly-alert"
      : resultTone === "warning"
        ? "border-warning/50 bg-[#fff6ed]"
        : "border-secondary/50 bg-[#f1feff]"
  const resultTextClass =
    resultTone === "shortfall" ? "text-destructive" : resultTone === "warning" ? "text-warning" : "text-success"
  const lowMarginPercent = formatLowMonthlyMarginPercent(lowMonthlyMarginBasisPoints)
  const lowMarginAmount = formatWholeCurrency(
    getLowMonthlyMarginCents(summary.monthlyDepositsCents, lowMonthlyMarginBasisPoints),
    locale
  )

  return (
    <Card className={`fathly-card ${cardToneClass}`}>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-3 lg:items-center">
        <div className="grid gap-4 sm:grid-cols-2">
          <SnapshotMetric
            label={dictionary.dashboard.deposits}
            tone="income"
            value={formatWholeCurrency(summary.monthlyDepositsCents, locale)}
          />
          <SnapshotMetric
            label={dictionary.dashboard.monthOutflows}
            tone="expense"
            value={formatWholeCurrency(summary.monthlyCommitmentsCents, locale)}
          />
        </div>

        <div className="border-y border-border py-5 text-center lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{dictionary.dashboard.monthlyResult}</p>
          <p className={`mt-2 font-mono text-5xl font-bold leading-none md:text-6xl ${resultTextClass}`}>
            {resultAmount}
          </p>
          <p className="mx-auto mt-3 max-w-48 text-sm font-medium leading-5 text-muted-foreground">{resultDescription}</p>
          {resultTone === "warning" && (
            <p className="mx-auto mt-2 w-fit rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
              {dictionary.dashboard.monthlyResultLowMargin} {lowMarginPercent}: {lowMarginAmount}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {resultTone === "shortfall" ? (
              <AlertTriangleIcon className="size-5 text-destructive" />
            ) : resultTone === "warning" ? (
              <AlertTriangleIcon className="size-5 text-warning" />
            ) : (
              <ZapIcon className="size-5 text-primary" />
            )}
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{dictionary.dashboard.coverage}</p>
          </div>
          <div className="flex items-end gap-2">
            <span
              className={`font-mono text-3xl font-bold ${resultTone === "shortfall" ? "text-destructive" : resultTone === "warning" ? "text-warning" : "text-primary"}`}
            >
              {formatBudgetUsagePercent(summary.coverageRatio, locale)}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">{dictionary.dashboard.covered}</span>
          </div>
          <Progress
            className={`[&_[data-slot=progress-track]]:h-4 [&_[data-slot=progress-track]]:bg-border ${resultTone === "shortfall" ? "[&_[data-slot=progress-indicator]]:bg-destructive" : resultTone === "warning" ? "[&_[data-slot=progress-indicator]]:bg-warning" : "[&_[data-slot=progress-indicator]]:bg-primary"}`}
            value={summary.coverageRatio * 100}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SnapshotMetric({
  label,
  tone = "income",
  value,
}: {
  label: string
  tone?: "income" | "expense"
  value: string
}) {
  const Icon = tone === "expense" ? ActivityIcon : PlugZapIcon

  return (
    <div className="flex items-center gap-4">
      <span
        className={`flex size-12 items-center justify-center rounded-full ${
          tone === "expense" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground md:text-sm">{label}</p>
        <p className={`mt-1 font-mono text-3xl font-bold md:text-4xl ${tone === "expense" ? "text-destructive" : "text-success"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function IncomePanel({
  deposits,
  dictionary,
  locale,
}: {
  deposits: Deposit[]
  dictionary: Dictionary
  locale: Locale
}) {
  const totalCents = deposits
    .filter((deposit) => deposit.status === "ACTIVE")
    .reduce((sum, deposit) => sum + deposit.amountCents, 0)
  const sortedDeposits = deposits.toSorted((a, b) => b.amountCents - a.amountCents)

  return (
    <Card className="fathly-card border-success/35">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CircleDollarSignIcon className="size-5 text-success" />
              {dictionary.nav.deposits}
            </CardTitle>
            <CardDescription>{dictionary.dashboard.incomeBody}</CardDescription>
          </div>
          <BudgetDialogForm action={createDeposit} dictionary={dictionary} kind="deposit" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y divide-border">
          {deposits.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">{dictionary.dashboard.emptyBody}</p>
          ) : (
            sortedDeposits.map((deposit) => (
              <BudgetRowContextMenu
                deleteAction={deleteDeposit.bind(null, deposit.id)}
                dictionary={dictionary}
                item={deposit}
                key={deposit.id}
                kind="deposit"
                updateAction={updateDeposit.bind(null, deposit.id)}
              >
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-2 py-3 -mx-2 transition-colors hover:bg-muted">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{deposit.name}</p>
                    {deposit.notes && <p className="truncate text-sm text-muted-foreground">{deposit.notes}</p>}
                  </div>
                  <p className="font-mono font-semibold">{formatWholeCurrency(deposit.amountCents, locale)}</p>
                  <BudgetRowActions
                    deleteAction={deleteDeposit.bind(null, deposit.id)}
                    dictionary={dictionary}
                    item={deposit}
                    kind="deposit"
                    updateAction={updateDeposit.bind(null, deposit.id)}
                  />
                </div>
              </BudgetRowContextMenu>
            ))
          )}
        </div>
        <div className="ml-auto flex w-fit items-center gap-4 rounded-2xl border border-success/20 bg-success/10 px-5 py-2">
          <span className="font-semibold">{dictionary.dashboard.incomeTotal}</span>
          <span className="font-mono text-lg font-bold text-success">{formatWholeCurrency(totalCents, locale)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function OutflowTable({
  commitments,
  dictionary,
  locale,
}: {
  commitments: (Commitment & { monthlyAmountCents: number })[]
  dictionary: Dictionary
  locale: Locale
}) {
  const categoryGroups = groupCommitmentsForTable(commitments)

  return (
    <div>
      <Table>
        <TableBody>
          {commitments.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={3}>
                {dictionary.dashboard.emptyBody}
              </TableCell>
            </TableRow>
          ) : (
            categoryGroups.map((group, index) => (
              <Fragment key={group.category}>
                {index > 0 && (
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={3} className="h-4 p-0" />
                  </TableRow>
                )}
                <CollapsibleCategoryGroup
                  actionColumn
                  category={group.category}
                  collapseLabel={dictionary.actions.collapseCategory}
                  expandLabel={dictionary.actions.expandCategory}
                  total={formatWholeCurrency(group.totalCents, locale)}
                  totalClassName="text-destructive"
                  totalLabel={dictionary.dashboard.categoryTotal}
                >
                  {group.commitments.map((commitment, commitmentIndex) => (
                    <BudgetRowContextMenu
                      deleteAction={deleteCommitment.bind(null, commitment.id)}
                      dictionary={dictionary}
                      item={commitment}
                      key={commitment.id}
                      kind="commitment"
                      updateAction={updateCommitment.bind(null, commitment.id)}
                    >
                      <TableRow className={commitmentIndex === group.commitments.length - 1 ? "border-b-0" : undefined}>
                        <TableCell className="pl-6 font-medium">
                          <CommitmentName commitment={commitment} />
                        </TableCell>
                        <TableCell className="w-28 pr-1 text-right font-mono font-semibold">
                          {formatWholeCurrency(commitment.monthlyAmountCents, locale)}
                        </TableCell>
                        <TableCell className="w-9 p-0 text-right">
                          <BudgetRowActions
                            deleteAction={deleteCommitment.bind(null, commitment.id)}
                            dictionary={dictionary}
                            item={commitment}
                            kind="commitment"
                            updateAction={updateCommitment.bind(null, commitment.id)}
                          />
                        </TableCell>
                      </TableRow>
                    </BudgetRowContextMenu>
                  ))}
                </CollapsibleCategoryGroup>
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function CommitmentName({ commitment }: { commitment: Pick<Commitment, "icon" | "name"> }) {
  const option = getCommitmentIconOption(commitment.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="truncate">{commitment.name}</span>
    </span>
  )
}
