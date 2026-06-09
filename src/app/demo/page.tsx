import Link from "next/link"
import type React from "react"
import { ArrowLeftIcon, CalendarDaysIcon, CircleDollarSignIcon, HomeIcon, PiggyBankIcon, SparklesIcon } from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/budget/format"
import { calculateBudgetSummary, groupCommitmentsByCategory, monthlyAmountCents } from "@/lib/budget/math"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"

const demoDeposits = [
  { id: "a", name: "Alex", amountCents: 180_000, notes: "Monthly transfer", status: "ACTIVE" as const },
  { id: "b", name: "Sam", amountCents: 180_000, notes: "Monthly transfer", status: "ACTIVE" as const },
  { id: "c", name: "Buffer", amountCents: 20_000, notes: "Shared cushion", status: "ACTIVE" as const },
]

const demoCommitments = [
  { id: "mortgage", name: "Hipoteca", category: "Casa", amountCents: 111_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "groceries", name: "Compra", category: "Casa", amountCents: 60_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "cleaning", name: "Limpieza", category: "Casa", amountCents: 46_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "childcare", name: "Guarderia", category: "Hijos", amountCents: 34_500, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "utilities", name: "Gas / Agua / Luz", category: "Suministros", amountCents: 19_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "insurance", name: "Seguro hogar + IBI", category: "Prorrateados", amountCents: 185_500, frequency: "ANNUAL" as const, status: "ACTIVE" as const, type: "BILL" as const },
  { id: "savings", name: "Ahorro familiar", category: "Ahorro", amountCents: 30_000, frequency: "MONTHLY" as const, status: "ACTIVE" as const, type: "SAVINGS" as const },
]

export default async function DemoPage() {
  const [dictionary, locale] = await Promise.all([getServerDictionary(), getLocale()])
  const summary = calculateBudgetSummary(demoDeposits, demoCommitments)
  const grouped = Object.entries(groupCommitmentsByCategory(demoCommitments))
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)

  return (
    <main className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-primary/20 bg-primary-bg/95 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/auth/signin">
            <AppIcon className="size-11 fathly-color-shadow" />
            <span className="fathly-ribbon text-sm">{dictionary.appName}</span>
          </Link>
          <Button nativeButton={false} render={<Link href="/auth/signin" />} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            Sign in
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="fathly-hero flex min-h-[420px] flex-col justify-between p-6 md:p-8">
            <div className="flex flex-col gap-5">
              <div>
                <Badge className="mb-4 w-fit bg-cream text-primary-dark shadow-[0_4px_20px_rgba(255,210,63,0.35)] hover:bg-cream">Mock demo</Badge>
                <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-[0.03em] drop-shadow-sm md:text-6xl">
                  {dictionary.dashboard.title}
                </h1>
                <p className="mt-2 max-w-2xl text-base font-medium text-white/85 md:text-lg">{dictionary.dashboard.subtitle}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroMetric label={dictionary.dashboard.deposits} value={formatCurrency(summary.monthlyDepositsCents, locale)} />
                <HeroMetric label={dictionary.dashboard.commitments} value={formatCurrency(summary.monthlyCommitmentsCents, locale)} />
                <HeroMetric label={dictionary.dashboard.annual} value={formatCurrency(summary.annualProratedCents, locale)} />
                <HeroMetric label={dictionary.dashboard.savings} value={formatCurrency(summary.savingsCents, locale)} />
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-white/35 border-l-[6px] border-l-accent bg-white/18 p-5 shadow-[0_4px_20px_rgba(255,210,63,0.22)] backdrop-blur">
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-accent-light">
                {summary.coverageCents >= 0 ? dictionary.dashboard.covered : dictionary.dashboard.shortBy}
              </p>
              <p className="mt-1 font-heading text-4xl font-extrabold md:text-5xl">
                {formatCurrency(Math.abs(summary.coverageCents), locale)}
              </p>
              <Progress className="mt-5 [&_[data-slot=progress-indicator]]:bg-accent [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/25" value={summary.coverageRatio * 100} />
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="fathly-card border-l-accent bg-[linear-gradient(135deg,#ffffff_0%,#fff8e7_100%)] shadow-[0_4px_20px_rgba(255,210,63,0.24)]">
              <CardHeader>
                <CardTitle className="font-heading text-2xl font-bold">{dictionary.dashboard.commandCenter}</CardTitle>
                <CardDescription>{dictionary.dashboard.commandBody}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button disabled>{dictionary.actions.addDeposit}</Button>
                <Button disabled variant="secondary">{dictionary.actions.addBill}</Button>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <Button disabled size="sm" variant="outline">{dictionary.actions.addMonthlyBill}</Button>
                  <Button disabled size="sm" variant="outline">{dictionary.actions.addAnnualCost}</Button>
                  <Button disabled size="sm" variant="outline">{dictionary.actions.addSavings}</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="fathly-card border-l-sky-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold">
                  <span className="flex size-9 items-center justify-center rounded-full bg-sky-blue/15 text-sky-blue">
                    <SparklesIcon className="size-5" />
                  </span>
                  {dictionary.dashboard.breakdown}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommitmentChart data={grouped} locale={locale} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="fathly-section-title text-3xl">{dictionary.dashboard.budgetData}</h2>
            <p className="mt-2 text-muted-foreground">{dictionary.dashboard.budgetDataBody}</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <DemoTable
              icon={<CircleDollarSignIcon className="size-5 text-primary" />}
              rows={demoDeposits.map((deposit) => ({
                amount: deposit.amountCents,
                category: deposit.notes,
                frequency: dictionary.forms.monthly,
                id: deposit.id,
                name: deposit.name,
              }))}
              title={dictionary.nav.deposits}
              locale={locale}
            />
            <DemoTable
              icon={<HomeIcon className="size-5 text-secondary" />}
              rows={demoCommitments
                .filter((commitment) => commitment.type === "BILL" && commitment.frequency === "MONTHLY")
                .map((commitment) => ({
                  amount: monthlyAmountCents(commitment),
                  category: commitment.category,
                  frequency: dictionary.forms.monthly,
                  id: commitment.id,
                  name: commitment.name,
                }))}
              title={dictionary.nav.monthlyBills}
              locale={locale}
            />
            <DemoTable
              icon={<CalendarDaysIcon className="size-5 text-warning" />}
              rows={demoCommitments
                .filter((commitment) => commitment.type === "BILL" && commitment.frequency === "ANNUAL")
                .map((commitment) => ({
                  amount: monthlyAmountCents(commitment),
                  category: commitment.category,
                  frequency: dictionary.forms.annual,
                  id: commitment.id,
                  name: commitment.name,
                }))}
              title={dictionary.nav.annualCosts}
              locale={locale}
            />
            <DemoTable
              icon={<PiggyBankIcon className="size-5 text-success" />}
              rows={demoCommitments
                .filter((commitment) => commitment.type === "SAVINGS")
                .map((commitment) => ({
                  amount: monthlyAmountCents(commitment),
                  category: commitment.category,
                  frequency: dictionary.forms.monthly,
                  id: commitment.id,
                  name: commitment.name,
                }))}
              title={dictionary.nav.savings}
              locale={locale}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function DemoTable({
  icon,
  locale,
  rows,
  title,
}: {
  icon: React.ReactNode
  locale: "es" | "en"
  rows: { amount: number; category: string | null; frequency: string; id: string; name: string }[]
  title: string
}) {
  return (
    <Card className="fathly-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.frequency}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(row.amount, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/30 border-l-[6px] border-l-accent bg-cream/18 p-4 shadow-[0_4px_20px_rgba(43,168,162,0.18)] backdrop-blur">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent-light">{label}</p>
      <p className="mt-2 font-heading text-2xl font-extrabold">{value}</p>
    </div>
  )
}
