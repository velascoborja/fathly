import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import {
  ArchiveIcon,
  ArrowDownCircleIcon,
  ArrowLeftIcon,
  ArrowUpCircleIcon,
  CircleDollarSignIcon,
  EqualIcon,
  WalletCardsIcon,
} from "lucide-react"
import type { Commitment, Deposit } from "@prisma/client"

import { AnnualProratedIndicator } from "@/components/budget/annual-prorated-indicator"
import { CheckpointDeleteDialog } from "@/components/budget/checkpoint-delete-dialog"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
import { getDepositIconOption } from "@/lib/budget/deposit-icons"
import { formatWholeCurrency } from "@/lib/budget/format"
import {
  calculateBudgetSummary,
  getCommitmentBreakdown,
  groupCommitmentsForTable,
} from "@/lib/budget/math"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { deleteCheckpoint } from "@/server/actions"
import { getCheckpointData } from "@/server/household"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

export const dynamic = "force-dynamic"

type Dictionary = (typeof dictionaries)[Locale]

export default async function CheckpointDetailPage({
  params,
}: {
  params: Promise<{ checkpointId: string }>
}) {
  const { checkpointId } = await params
  const [data, dictionary, locale] = await Promise.all([
    getCheckpointData(checkpointId),
    getServerDictionary(),
    getLocale(),
  ])
  const checkpointSummary = calculateBudgetSummary(data.checkpoint.deposits, data.checkpoint.commitments)
  const activeSummary = calculateBudgetSummary(data.activeDeposits, data.activeCommitments)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button nativeButton={false} render={<Link href="/checkpoints" />} size="sm" variant="ghost">
            <ArrowLeftIcon data-icon="inline-start" />
            {dictionary.checkpoints.backToCheckpoints}
          </Button>
          <h1 className="fathly-section-title mt-3 flex items-center gap-2 text-3xl">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
              <ArchiveIcon className="size-5" />
            </span>
            {data.checkpoint.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {dictionary.checkpoints.snapshotDate}: {formatDate(data.checkpoint.createdAt, locale)}
          </p>
        </div>
        <CheckpointDeleteDialog
          action={deleteCheckpoint.bind(null, data.checkpoint.id)}
          checkpointName={data.checkpoint.name}
          dictionary={dictionary}
          redirectTo="/checkpoints"
        />
      </div>

      <Card className="fathly-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.checkpoints.comparisonTitle}</CardTitle>
          <CardDescription>{dictionary.checkpoints.comparisonBody}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
            <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(112px,auto)_minmax(112px,auto)_minmax(112px,auto)] gap-4 border-b border-border/70 bg-muted/45 px-4 py-3 text-xs font-semibold text-muted-foreground md:grid">
              <span>{dictionary.checkpoints.concept}</span>
              <span>{dictionary.checkpoints.archivedThen}</span>
              <span>{dictionary.checkpoints.activeNow}</span>
              <span>{dictionary.dashboard.difference}</span>
            </div>
            <ComparisonTableRow
              checkpoint={checkpointSummary.monthlyDepositsCents}
              current={activeSummary.monthlyDepositsCents}
              dictionary={dictionary}
              icon={<ArrowUpCircleIcon className="size-4" />}
              label={dictionary.checkpoints.monthlyDeposits}
              locale={locale}
              tone="income"
            />
            <ComparisonTableRow
              checkpoint={checkpointSummary.monthlyCommitmentsCents}
              current={activeSummary.monthlyCommitmentsCents}
              dictionary={dictionary}
              icon={<ArrowDownCircleIcon className="size-4" />}
              label={dictionary.checkpoints.monthlyOutflows}
              locale={locale}
              tone="expense"
            />
            <ComparisonTableRow
              checkpoint={checkpointSummary.coverageCents}
              current={activeSummary.coverageCents}
              dictionary={dictionary}
              icon={<WalletCardsIcon className="size-4" />}
              label={dictionary.checkpoints.monthlyRemaining}
              locale={locale}
              tone="remaining"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(520px,1.55fr)]">
        <Card className="fathly-card border-success/35">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CircleDollarSignIcon className="size-5 text-success" />
              {dictionary.checkpoints.archivedIncome}
            </CardTitle>
            <CardDescription>{dictionary.checkpoints.readonlyHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <DepositList deposits={data.checkpoint.deposits} dictionary={dictionary} locale={locale} />
          </CardContent>
        </Card>

        <Card className="fathly-card border-destructive/35">
          <CardHeader>
            <CardTitle className="text-2xl">{dictionary.checkpoints.archivedExpenses}</CardTitle>
            <CardDescription>{dictionary.checkpoints.readonlyHint}</CardDescription>
          </CardHeader>
          <CardContent className="max-sm:px-2">
            <CommitmentTable commitments={data.checkpoint.commitments} dictionary={dictionary} locale={locale} />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function ComparisonTableRow({
  checkpoint,
  current,
  dictionary,
  icon,
  label,
  locale,
  tone,
}: {
  checkpoint: number
  current: number
  dictionary: Dictionary
  icon: ReactNode
  label: string
  locale: Locale
  tone: "income" | "expense" | "remaining"
}) {
  const delta = current - checkpoint
  const toneClasses = {
    income: {
      icon: "bg-success/15 text-success",
      value: "text-success",
    },
    expense: {
      icon: "bg-destructive/15 text-destructive",
      value: "text-destructive",
    },
    remaining: {
      icon: "bg-primary/15 text-primary",
      value: current < 0 ? "text-destructive" : "text-primary",
    },
  }[tone]
  const deltaClass =
    delta === 0
      ? "text-muted-foreground"
      : tone === "expense"
        ? delta > 0
          ? "text-destructive"
          : "text-success"
        : delta > 0
          ? "text-success"
          : "text-destructive"

  return (
    <div className="grid gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(180px,1fr)_minmax(112px,auto)_minmax(112px,auto)_minmax(112px,auto)] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center justify-between gap-3 md:justify-start">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneClasses.icon}`}>{icon}</span>
          <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
        </div>
        <ComparisonDelta delta={delta} dictionary={dictionary} locale={locale} valueClassName={deltaClass} className="md:hidden" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:contents">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground md:hidden">{dictionary.checkpoints.archivedThen}</p>
          <p className="font-mono text-lg font-bold">{formatWholeCurrency(checkpoint, locale)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground md:hidden">{dictionary.checkpoints.activeNow}</p>
          <p className={`font-mono text-lg font-bold ${toneClasses.value}`}>{formatWholeCurrency(current, locale)}</p>
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="text-xs font-semibold text-muted-foreground md:hidden">{dictionary.dashboard.difference}</p>
          <ComparisonDelta delta={delta} dictionary={dictionary} locale={locale} valueClassName={deltaClass} />
        </div>
      </div>
    </div>
  )
}

function ComparisonDelta({
  className = "",
  delta,
  dictionary,
  locale,
  valueClassName,
}: {
  className?: string
  delta: number
  dictionary: Dictionary
  locale: Locale
  valueClassName: string
}) {
  if (delta !== 0) {
    return <p className={`font-mono text-sm font-bold ${valueClassName} ${className}`}>{formatSignedCurrency(delta, locale)}</p>
  }

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary ${className}`}
    >
      <EqualIcon className="size-3.5" />
      {dictionary.checkpoints.noChange}
    </span>
  )
}

function DepositList({
  deposits,
  dictionary,
  locale,
}: {
  deposits: Deposit[]
  dictionary: Dictionary
  locale: Locale
}) {
  if (deposits.length === 0) {
    return <p className="py-3 text-sm text-muted-foreground">{dictionary.dashboard.emptyBody}</p>
  }

  return (
    <div className="space-y-1">
      {deposits.map((deposit, index) => (
        <div className={index === deposits.length - 1 ? "border-b-0" : "border-b border-border"} key={deposit.id}>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 -mx-2 rounded-xl px-2 py-3">
            <DepositName deposit={deposit} />
            <p className="font-mono font-semibold">{formatWholeCurrency(deposit.amountCents, locale)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CommitmentTable({
  commitments,
  dictionary,
  locale,
}: {
  commitments: Commitment[]
  dictionary: Dictionary
  locale: Locale
}) {
  const outflows = getCommitmentBreakdown(commitments)
  const categoryGroups = groupCommitmentsForTable(outflows)

  return (
    <Table className="table-fixed">
      <colgroup>
        <col />
        <col className="w-28 max-sm:w-18" />
      </colgroup>
      <TableBody>
        {outflows.length === 0 ? (
          <TableRow>
            <TableCell className="text-muted-foreground" colSpan={2}>
              {dictionary.dashboard.emptyBody}
            </TableCell>
          </TableRow>
        ) : (
          categoryGroups.map((group, index) => (
            <Fragment key={group.category}>
              {index > 0 && (
                <TableRow className="fathly-row-hover-transparent border-0">
                  <TableCell colSpan={2} className="h-4 p-0" />
                </TableRow>
              )}
              <CollapsibleCategoryGroup
                category={group.category}
                collapseLabel={dictionary.actions.collapseCategory}
                expandLabel={dictionary.actions.expandCategory}
                total={formatWholeCurrency(group.totalCents, locale)}
                totalClassName="text-destructive"
                totalLabel={dictionary.dashboard.categoryTotal}
                totalVariant="inline"
              >
                {group.commitments.map((commitment, commitmentIndex) => (
                  <TableRow className={commitmentIndex === group.commitments.length - 1 ? "border-b-0" : undefined} key={commitment.id}>
                    <TableCell className="min-w-0 overflow-hidden pl-6 font-medium max-sm:pl-2">
                      <CommitmentName commitment={commitment} dictionary={dictionary} />
                    </TableCell>
                    <TableCell className="w-28 pr-1 text-right font-mono font-semibold whitespace-nowrap max-sm:w-18 max-sm:text-sm">
                      {formatWholeCurrency(commitment.monthlyAmountCents, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </CollapsibleCategoryGroup>
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function CommitmentName({
  commitment,
  dictionary,
}: {
  commitment: Pick<Commitment, "frequency" | "icon" | "name">
  dictionary: Dictionary
}) {
  const option = getCommitmentIconOption(commitment.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{commitment.name}</span>
        <AnnualProratedIndicator
          accessibleLabel={dictionary.forms.annualProratedIndicator}
          frequency={commitment.frequency}
          label={dictionary.forms.annual}
        />
      </span>
    </span>
  )
}

function DepositName({ deposit }: { deposit: Pick<Deposit, "icon" | "name" | "notes"> }) {
  const option = getDepositIconOption(deposit.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{deposit.name}</span>
        {deposit.notes && <span className="block truncate text-sm text-muted-foreground">{deposit.notes}</span>}
      </span>
    </span>
  )
}

function formatSignedCurrency(cents: number, locale: Locale) {
  const sign = cents > 0 ? "+" : "-"

  return `${sign}${formatWholeCurrency(Math.abs(cents), locale)}`
}

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "medium",
  }).format(date)
}
