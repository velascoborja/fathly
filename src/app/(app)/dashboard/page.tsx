import { ArrowUpRightIcon } from "lucide-react"

import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { SummaryCard } from "@/components/budget/summary-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateBudgetSummary, groupCommitmentsByCategory, monthlyAmountCents } from "@/lib/budget/math"
import { formatCurrency } from "@/lib/budget/format"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { createCommitment, createDeposit } from "@/server/actions"
import { getBudgetData } from "@/server/household"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [data, dictionary, locale] = await Promise.all([getBudgetData(), getServerDictionary(), getLocale()])
  const summary = calculateBudgetSummary(data.deposits, data.commitments)
  const grouped = Object.entries(groupCommitmentsByCategory(data.commitments))
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)
  const largest = data.commitments
    .filter((commitment) => commitment.status === "ACTIVE")
    .map((commitment) => ({ ...commitment, monthlyCents: monthlyAmountCents(commitment) }))
    .sort((a, b) => b.monthlyCents - a.monthlyCents)
    .slice(0, 5)
  const hasData = data.deposits.length > 0 || data.commitments.length > 0

  return (
    <>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">{dictionary.dashboard.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{dictionary.dashboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BudgetDialogForm action={createDeposit} dictionary={dictionary} kind="deposit" />
          <BudgetDialogForm action={createCommitment} dictionary={dictionary} kind="commitment" />
        </div>
      </section>

      {!hasData && (
        <Card className="fathly-card border-[#FFD21E] bg-secondary">
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="fathly-card bg-secondary md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{summary.coverageCents >= 0 ? dictionary.dashboard.covered : dictionary.dashboard.shortBy}</span>
              <Badge variant={summary.coverageCents >= 0 ? "secondary" : "destructive"}>
                {formatCurrency(Math.abs(summary.coverageCents), locale)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-4xl font-bold">{formatCurrency(summary.coverageCents, locale)}</p>
              <p className="text-sm text-muted-foreground">{dictionary.dashboard.remaining}</p>
            </div>
            <Progress value={summary.coverageRatio * 100} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(summary.monthlyDepositsCents, locale)}</span>
              <span>{formatCurrency(summary.monthlyCommitmentsCents, locale)}</span>
            </div>
          </CardContent>
        </Card>
        <SummaryCard label={dictionary.dashboard.deposits} value={formatCurrency(summary.monthlyDepositsCents, locale)} />
        <SummaryCard label={dictionary.dashboard.commitments} value={formatCurrency(summary.monthlyCommitmentsCents, locale)} />
        <SummaryCard label={dictionary.dashboard.annual} value={formatCurrency(summary.annualProratedCents, locale)} />
        <SummaryCard label={dictionary.dashboard.savings} value={formatCurrency(summary.savingsCents, locale)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="fathly-card">
          <CardHeader>
            <CardTitle>{dictionary.dashboard.commitments}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.forms.name}</TableHead>
                  <TableHead>{dictionary.forms.category}</TableHead>
                  <TableHead>{dictionary.forms.frequency}</TableHead>
                  <TableHead className="text-right">{dictionary.forms.amount}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.commitments.slice(0, 10).map((commitment) => (
                  <TableRow key={commitment.id}>
                    <TableCell className="font-medium">{commitment.name}</TableCell>
                    <TableCell>{commitment.category}</TableCell>
                    <TableCell>{commitment.frequency === "ANNUAL" ? dictionary.forms.annual : dictionary.forms.monthly}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(monthlyAmountCents(commitment), locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="fathly-card">
            <CardHeader>
              <CardTitle>{dictionary.dashboard.breakdown}</CardTitle>
            </CardHeader>
            <CardContent>
              <CommitmentChart data={grouped} locale={locale} />
            </CardContent>
          </Card>
          <Card className="fathly-card">
            <CardHeader>
              <CardTitle>{dictionary.dashboard.largest}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {largest.map((item) => (
                <div className="flex items-center justify-between gap-3" key={item.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <span className="font-mono text-sm">{formatCurrency(item.monthlyCents, locale)}</span>
                </div>
              ))}
              <Button render={<a href="/monthly-bills" />} variant="outline">
                <ArrowUpRightIcon data-icon="inline-end" />
                {dictionary.nav.monthlyBills}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
