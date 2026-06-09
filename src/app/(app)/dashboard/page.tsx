import {
  CalendarDaysIcon,
  CircleDollarSignIcon,
  HomeIcon,
  PiggyBankIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react"
import type { Commitment, Deposit } from "@prisma/client"

import { HouseholdNameForm } from "@/components/app/household-name-form"
import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { CommitmentTable, DepositTable } from "@/components/budget/item-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { calculateBudgetSummary, groupCommitmentsByCategory } from "@/lib/budget/math"
import { formatCurrency } from "@/lib/budget/format"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import {
  createCommitment,
  createDeposit,
  deleteCommitment,
  deleteDeposit,
  updateHouseholdName,
} from "@/server/actions"
import { getBudgetData } from "@/server/household"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

export const dynamic = "force-dynamic"

type Dictionary = (typeof dictionaries)[Locale]

export default async function DashboardPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const summary = calculateBudgetSummary(data.deposits, data.commitments)
  const grouped = Object.entries(groupCommitmentsByCategory(data.commitments))
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)
  const monthlyBills = data.commitments.filter(
    (commitment) => commitment.type === "BILL" && commitment.frequency === "MONTHLY"
  )
  const annualCosts = data.commitments.filter(
    (commitment) => commitment.type === "BILL" && commitment.frequency === "ANNUAL"
  )
  const savings = data.commitments.filter((commitment) => commitment.type === "SAVINGS")
  const hasData = data.deposits.length > 0 || data.commitments.length > 0

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="fathly-hero flex min-h-[420px] flex-col justify-between p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div>
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
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-accent-light">
                  {summary.coverageCents >= 0 ? dictionary.dashboard.covered : dictionary.dashboard.shortBy}
                </p>
                <p className="mt-1 font-heading text-4xl font-extrabold md:text-5xl">
                  {formatCurrency(Math.abs(summary.coverageCents), locale)}
                </p>
                <p className="mt-1 text-sm font-medium text-white/80">{dictionary.dashboard.remaining}</p>
              </div>
              <Badge className="w-fit bg-cream text-primary-dark shadow-[0_4px_20px_rgba(255,210,63,0.35)] hover:bg-cream">
                {formatCurrency(summary.coverageCents, locale)}
              </Badge>
            </div>
            <Progress className="mt-5 [&_[data-slot=progress-indicator]]:bg-accent [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/25" value={summary.coverageRatio * 100} />
          </div>
        </div>

        <div className="grid gap-5">
          <BudgetCommandPanel dictionary={dictionary} />
          <Card className="fathly-card border-l-sky-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold">
                <span className="flex size-9 items-center justify-center rounded-full bg-sky-blue/15 text-sky-blue">
                  <SparklesIcon className="size-5" />
                </span>
                {dictionary.dashboard.breakdown}
              </CardTitle>
              <CardDescription>{dictionary.dashboard.liveUpdateHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <CommitmentChart data={grouped} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </section>

      {!hasData && (
        <Card className="fathly-card border-accent border-l-accent bg-cream">
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

      <BudgetDataSection
        annualCosts={annualCosts}
        deposits={data.deposits}
        dictionary={dictionary}
        locale={locale}
        monthlyBills={monthlyBills}
        savings={savings}
      />

      <Card className="fathly-card border-l-primary-dark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-bg text-primary-dark">
              <SettingsIcon className="size-5" />
            </span>
            {dictionary.nav.settings}
          </CardTitle>
          <CardDescription>{dictionary.settings.householdCardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdNameForm
            action={updateHouseholdName}
            dictionary={dictionary}
            householdName={data.household.name}
          />
        </CardContent>
      </Card>
    </>
  )
}

function BudgetCommandPanel({ dictionary }: { dictionary: Dictionary }) {
  return (
    <Card className="fathly-card border-l-accent bg-[linear-gradient(135deg,#ffffff_0%,#fff8e7_100%)] shadow-[0_4px_20px_rgba(255,210,63,0.24)]">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold">{dictionary.dashboard.commandCenter}</CardTitle>
        <CardDescription>{dictionary.dashboard.commandBody}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <BudgetDialogForm action={createDeposit} dictionary={dictionary} kind="deposit" />
        <BudgetDialogForm action={createCommitment} dictionary={dictionary} kind="commitment" />
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <BudgetDialogForm
            action={createCommitment}
            defaults={{ frequency: "MONTHLY", type: "BILL" }}
            dictionary={dictionary}
            kind="commitment"
            triggerLabel={dictionary.actions.addMonthlyBill}
          />
          <BudgetDialogForm
            action={createCommitment}
            defaults={{ frequency: "ANNUAL", type: "BILL" }}
            dictionary={dictionary}
            kind="commitment"
            triggerLabel={dictionary.actions.addAnnualCost}
          />
          <BudgetDialogForm
            action={createCommitment}
            defaults={{ category: "Ahorro", frequency: "MONTHLY", type: "SAVINGS" }}
            dictionary={dictionary}
            kind="commitment"
            triggerLabel={dictionary.actions.addSavings}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetDataSection({
  annualCosts,
  deposits,
  dictionary,
  locale,
  monthlyBills,
  savings,
}: {
  annualCosts: Commitment[]
  deposits: Deposit[]
  dictionary: Dictionary
  locale: Locale
  monthlyBills: Commitment[]
  savings: Commitment[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="fathly-section-title text-3xl">{dictionary.dashboard.budgetData}</h2>
        <p className="mt-2 text-muted-foreground">{dictionary.dashboard.budgetDataBody}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <DataLane
          action={<BudgetDialogForm action={createDeposit} dictionary={dictionary} kind="deposit" />}
          icon={<CircleDollarSignIcon className="size-5" />}
          label={dictionary.nav.deposits}
          tone="text-primary"
        >
          <DepositTable deposits={deposits} dictionary={dictionary} locale={locale} onDelete={deleteDeposit} />
        </DataLane>
        <DataLane
          action={
            <BudgetDialogForm
              action={createCommitment}
              defaults={{ frequency: "MONTHLY", type: "BILL" }}
              dictionary={dictionary}
              kind="commitment"
              triggerLabel={dictionary.actions.addMonthlyBill}
            />
          }
          icon={<HomeIcon className="size-5" />}
          label={dictionary.nav.monthlyBills}
          tone="text-secondary"
        >
          <CommitmentTable
            commitments={monthlyBills}
            dictionary={dictionary}
            groupByCategory
            hideFrequency
            locale={locale}
            onDelete={deleteCommitment}
            title={dictionary.nav.monthlyBills}
          />
        </DataLane>
        <DataLane
          action={
            <BudgetDialogForm
              action={createCommitment}
              defaults={{ frequency: "ANNUAL", type: "BILL" }}
              dictionary={dictionary}
              kind="commitment"
              triggerLabel={dictionary.actions.addAnnualCost}
            />
          }
          icon={<CalendarDaysIcon className="size-5" />}
          label={dictionary.nav.annualCosts}
          tone="text-warning"
        >
          <CommitmentTable
            commitments={annualCosts}
            dictionary={dictionary}
            hideFrequency
            locale={locale}
            onDelete={deleteCommitment}
            showProratedAmount
            title={dictionary.nav.annualCosts}
          />
        </DataLane>
        <DataLane
          action={
            <BudgetDialogForm
              action={createCommitment}
              defaults={{ category: "Ahorro", frequency: "MONTHLY", type: "SAVINGS" }}
              dictionary={dictionary}
              kind="commitment"
              triggerLabel={dictionary.actions.addSavings}
            />
          }
          icon={<PiggyBankIcon className="size-5" />}
          label={dictionary.nav.savings}
          tone="text-success"
        >
          <CommitmentTable
            commitments={savings}
            dictionary={dictionary}
            locale={locale}
            onDelete={deleteCommitment}
            title={dictionary.nav.savings}
          />
        </DataLane>
      </div>
    </section>
  )
}

function DataLane({
  action,
  children,
  icon,
  label,
  tone,
}: {
  action: React.ReactNode
  children: React.ReactNode
  icon: React.ReactNode
  label: string
  tone: string
}) {
  return (
    <div aria-label={label} className="relative">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <span className={`flex size-9 items-center justify-center rounded-full bg-cream shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${tone}`}>{icon}</span>
        <div className="[&_[data-slot=button]]:h-8 [&_[data-slot=button]]:text-xs">{action}</div>
      </div>
      {children}
    </div>
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
