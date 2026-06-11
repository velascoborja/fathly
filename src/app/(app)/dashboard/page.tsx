import {
  ActivityIcon,
  AlertTriangleIcon,
  CircleDollarSignIcon,
  PlugZapIcon,
  ZapIcon,
} from "lucide-react"
import type { Commitment, Deposit } from "@prisma/client"
import type React from "react"

import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { DeleteButton } from "@/components/budget/delete-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateBudgetSummary, getCommitmentBreakdown } from "@/lib/budget/math"
import { formatCurrency } from "@/lib/budget/format"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import {
  createCommitment,
  createDeposit,
  deleteCommitment,
  deleteDeposit,
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

        <MonthlySnapshot dictionary={dictionary} hasData={hasData} locale={locale} summary={summary} />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.9fr)]">
          <div className="grid gap-4">
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
                />
              </CardContent>
            </Card>
            <IncomePanel deposits={data.deposits} dictionary={dictionary} locale={locale} />
          </div>

          <Card className="fathly-card">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">{dictionary.dashboard.monthOutflows}</CardTitle>
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
  summary,
}: {
  dictionary: Dictionary
  hasData: boolean
  locale: Locale
  summary: ReturnType<typeof calculateBudgetSummary>
}) {
  const short = summary.coverageCents < 0
  const status = !hasData ? dictionary.dashboard.emptyTitle : short ? dictionary.dashboard.shortBy : dictionary.dashboard.goodMargin

  return (
    <Card className={`fathly-card ${short ? "fathly-alert" : "border-secondary/50 bg-[#f1feff]"}`}>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_1.05fr_1fr] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <SnapshotMetric
            icon={<PlugZapIcon className="size-5" />}
            label={dictionary.dashboard.deposits}
            value={formatCurrency(summary.monthlyDepositsCents, locale)}
          />
          <SnapshotMetric
            icon={<ActivityIcon className="size-5" />}
            label={dictionary.dashboard.monthOutflows}
            tone="alert"
            value={formatCurrency(summary.monthlyCommitmentsCents, locale)}
          />
        </div>

        <div className="border-y border-border py-5 text-center lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{dictionary.dashboard.marginRemaining}</p>
          <p className="mt-2 font-mono text-5xl font-bold leading-none text-primary md:text-6xl">
            {formatCurrency(Math.abs(summary.coverageCents), locale)}
          </p>
          <p className={`mt-3 font-semibold ${short ? "text-destructive" : "text-success"}`}>{status}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dictionary.dashboard.remaining}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {short ? <AlertTriangleIcon className="size-5 text-destructive" /> : <ZapIcon className="size-5 text-primary" />}
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{dictionary.dashboard.coverage}</p>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-mono text-3xl font-bold text-primary">{Math.round(summary.coverageRatio * 100)}%</span>
            <span className="pb-1 text-sm text-muted-foreground">{dictionary.dashboard.covered}</span>
          </div>
          <Progress
            className="[&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-3 [&_[data-slot=progress-track]]:bg-border"
            value={summary.coverageRatio * 100}
          />
          <p className="text-sm text-muted-foreground">
            {dictionary.dashboard.annual}: {formatCurrency(summary.annualProratedCents, locale)} · {dictionary.dashboard.savings}:{" "}
            {formatCurrency(summary.savingsCents, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SnapshotMetric({
  icon,
  label,
  tone = "data",
  value,
}: {
  icon: React.ReactNode
  label: string
  tone?: "data" | "alert"
  value: string
}) {
  return (
    <div className="flex items-center gap-4">
      <span
        className={`flex size-12 items-center justify-center rounded-full ${
          tone === "alert" ? "bg-[#fff1ef] text-destructive" : "bg-secondary/15 text-secondary-foreground"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-3xl font-bold">{value}</p>
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

  return (
    <Card className="fathly-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CircleDollarSignIcon className="size-5 text-primary" />
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
            deposits.map((deposit) => (
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3" key={deposit.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{deposit.name}</p>
                  {deposit.notes && <p className="truncate text-sm text-muted-foreground">{deposit.notes}</p>}
                </div>
                <p className="font-mono font-semibold">{formatCurrency(deposit.amountCents, locale)}</p>
                <DeleteButton action={deleteDeposit.bind(null, deposit.id)} label={`Delete ${deposit.name}`} />
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-semibold">{dictionary.dashboard.incomeTotal}</span>
          <span className="font-mono text-lg font-bold">{formatCurrency(totalCents, locale)}</span>
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
  return (
    <div className="max-h-[620px] overflow-auto pr-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dictionary.forms.name}</TableHead>
            <TableHead className="hidden md:table-cell">{dictionary.forms.category}</TableHead>
            <TableHead className="hidden sm:table-cell">{dictionary.forms.frequency}</TableHead>
            <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {commitments.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={5}>
                {dictionary.dashboard.emptyBody}
              </TableCell>
            </TableRow>
          ) : (
            commitments.map((commitment) => (
              <TableRow key={commitment.id}>
                <TableCell className="font-medium">{commitment.name}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{commitment.category}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {commitment.frequency === "ANNUAL" ? dictionary.forms.annual : dictionary.forms.monthly}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(commitment.monthlyAmountCents, locale)}
                </TableCell>
                <TableCell>
                  <DeleteButton action={deleteCommitment.bind(null, commitment.id)} label={`Delete ${commitment.name}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
