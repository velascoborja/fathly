import Link from "next/link"
import { Fragment } from "react"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  CircleDollarSignIcon,
  PlugZapIcon,
  ZapIcon,
} from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatBudgetUsagePercent, formatWholeCurrency } from "@/lib/budget/format"
import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
import {
  calculateBudgetSummary,
  DEFAULT_LOW_MONTHLY_MARGIN_BASIS_POINTS,
  formatLowMonthlyMarginPercent,
  getCommitmentBreakdown,
  getLowMonthlyMarginCents,
  getMonthlyResultTone,
  groupCommitmentsForTable,
} from "@/lib/budget/math"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"

const demoDeposits = [
  { id: "a", name: "Alex", amountCents: 180_000, notes: "Monthly transfer", status: "ACTIVE" as const },
  { id: "b", name: "Sam", amountCents: 180_000, notes: "Monthly transfer", status: "ACTIVE" as const },
  { id: "c", name: "Buffer", amountCents: 20_000, notes: "Shared cushion", status: "ACTIVE" as const },
]

const demoCommitments = [
  { id: "mortgage", name: "Hipoteca", category: "Casa", icon: "home", amountCents: 111_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "groceries", name: "Compra", category: "Casa", icon: "shopping", amountCents: 60_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "cleaning", name: "Limpieza", category: "Casa", icon: "cleaning", amountCents: 46_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "childcare", name: "Guarderia Teresa", category: "Hijos", icon: "childcare", amountCents: 17_500, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "school", name: "Colegio Martin", category: "Hijos", icon: "school", amountCents: 20_500, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "fuel", name: "Gasolina RAV4", category: "Transporte", icon: "car", amountCents: 20_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "leisure", name: "Ocio", category: "Casa", icon: "leisure", amountCents: 15_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "gas", name: "Gas", category: "Suministros", icon: "gas", amountCents: 7_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "water", name: "Agua", category: "Suministros", icon: "water", amountCents: 3_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "power", name: "Luz", category: "Suministros", icon: "power", amountCents: 9_500, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "insurance", name: "Seguro hogar + IBI", category: "Prorrateados", icon: "insurance", amountCents: 185_500, frequency: "ANNUAL" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "savings", name: "Ahorro familiar", category: "Ahorro", icon: "savings", amountCents: 30_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "SAVINGS" as const },
]

export default async function DemoPage() {
  const [dictionary, locale] = await Promise.all([getServerDictionary(), getLocale()])
  const summary = calculateBudgetSummary(demoDeposits, demoCommitments)
  const outflows = getCommitmentBreakdown(demoCommitments)

  return (
    <main className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 shadow-[0_1px_4px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/auth/signin">
            <AppIcon className="size-10" />
            <span className="fathly-wordmark text-xs">{dictionary.appName}</span>
          </Link>
          <Button nativeButton={false} render={<Link href="/auth/signin" />} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            Sign in
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        <section className="fathly-hero flex flex-col gap-6 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <Badge className="w-fit border border-primary/25 bg-muted text-primary hover:bg-muted">Mock demo</Badge>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">{dictionary.dashboard.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{dictionary.dashboard.subtitle}</p>
          </div>

          <DemoSnapshot dictionary={dictionary} locale={locale} summary={summary} />

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.9fr)]">
            <div className="grid gap-4">
              <DemoIncomePanel dictionary={dictionary} locale={locale} />
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
                      icon: outflow.icon,
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
                  <Button disabled>{dictionary.actions.addBill}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <DemoOutflowTable dictionary={dictionary} locale={locale} rows={outflows} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

function DemoSnapshot({
  dictionary,
  locale,
  summary,
}: {
  dictionary: Awaited<ReturnType<typeof getServerDictionary>>
  locale: "es" | "en"
  summary: ReturnType<typeof calculateBudgetSummary>
}) {
  const resultTone = getMonthlyResultTone(summary)
  const short = resultTone === "shortfall"
  const resultAmount = `${short ? "-" : "+"}${formatWholeCurrency(Math.abs(summary.coverageCents), locale)}`
  const resultDescription = short ? dictionary.dashboard.monthlyResultShortfall : dictionary.dashboard.monthlyResultSurplus
  const cardToneClass =
    resultTone === "shortfall"
      ? "fathly-alert"
      : resultTone === "warning"
        ? "border-warning/50 bg-[#fff6ed]"
        : "border-secondary/50 bg-[#f1feff]"
  const resultTextClass =
    resultTone === "shortfall" ? "text-destructive" : resultTone === "warning" ? "text-warning" : "text-success"
  const lowMarginPercent = formatLowMonthlyMarginPercent(DEFAULT_LOW_MONTHLY_MARGIN_BASIS_POINTS)
  const lowMarginAmount = formatWholeCurrency(getLowMonthlyMarginCents(summary.monthlyDepositsCents), locale)

  return (
    <Card className={`fathly-card ${cardToneClass}`}>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-3 lg:items-center">
        <div className="grid gap-4 sm:grid-cols-2">
          <DemoMetric label={dictionary.dashboard.deposits} tone="income" value={formatWholeCurrency(summary.monthlyDepositsCents, locale)} />
          <DemoMetric label={dictionary.dashboard.monthOutflows} tone="expense" value={formatWholeCurrency(summary.monthlyCommitmentsCents, locale)} />
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

function DemoMetric({
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
      <span className={`flex size-12 items-center justify-center rounded-full ${tone === "expense" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
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

function DemoIncomePanel({ dictionary, locale }: { dictionary: Awaited<ReturnType<typeof getServerDictionary>>; locale: "es" | "en" }) {
  const totalCents = demoDeposits.reduce((sum, deposit) => sum + deposit.amountCents, 0)
  const sortedDeposits = demoDeposits.toSorted((a, b) => b.amountCents - a.amountCents)

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
          <Button disabled>{dictionary.actions.addDeposit}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y divide-border">
          {sortedDeposits.map((deposit) => (
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-2 py-3 -mx-2 transition-colors hover:bg-muted" key={deposit.id}>
              <div className="min-w-0">
                <p className="truncate font-medium">{deposit.name}</p>
                <p className="truncate text-sm text-muted-foreground">{deposit.notes}</p>
              </div>
              <p className="font-mono font-semibold">{formatWholeCurrency(deposit.amountCents, locale)}</p>
            </div>
          ))}
        </div>
        <div className="ml-auto flex w-fit items-center gap-4 rounded-2xl border border-success/20 bg-success/10 px-5 py-2">
          <span className="font-semibold">{dictionary.dashboard.incomeTotal}</span>
          <span className="font-mono text-lg font-bold text-success">{formatWholeCurrency(totalCents, locale)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DemoOutflowTable({
  dictionary,
  locale,
  rows,
}: {
  dictionary: Awaited<ReturnType<typeof getServerDictionary>>
  locale: "es" | "en"
  rows: (typeof demoCommitments[number] & { monthlyAmountCents: number })[]
}) {
  const categoryGroups = groupCommitmentsForTable(rows)

  return (
    <div>
      <Table>
        <TableBody>
          {categoryGroups.map((group, index) => (
            <Fragment key={group.category}>
              {index > 0 && (
                <TableRow className="border-0 hover:bg-transparent">
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
              >
                {group.commitments.map((row, rowIndex) => (
                  <TableRow className={rowIndex === group.commitments.length - 1 ? "border-b-0" : undefined} key={row.id}>
                    <TableCell className="pl-6 font-medium">
                      <DemoCommitmentName row={row} />
                    </TableCell>
                    <TableCell className="w-28 pr-1 text-right font-mono font-semibold">
                      {formatWholeCurrency(row.monthlyAmountCents, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </CollapsibleCategoryGroup>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function DemoCommitmentName({ row }: { row: Pick<(typeof demoCommitments)[number], "icon" | "name"> }) {
  const option = getCommitmentIconOption(row.icon)
  const Icon = option.icon

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${option.swatch}`}>
        <Icon className="size-4" />
      </span>
      <span className="truncate">{row.name}</span>
    </span>
  )
}
