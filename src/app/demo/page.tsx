import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AppIcon } from "@/components/app/app-icon"
import { CommitmentChart } from "@/components/budget/commitment-chart"
import { SummaryCard } from "@/components/budget/summary-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/budget/format"
import { calculateBudgetSummary, groupCommitmentsByCategory, monthlyAmountCents } from "@/lib/budget/math"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"

const demoDeposits = [
  { amountCents: 180_000, status: "ACTIVE" as const },
  { amountCents: 180_000, status: "ACTIVE" as const },
  { amountCents: 10_000, status: "ACTIVE" as const },
  { amountCents: 10_000, status: "ACTIVE" as const },
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
  const largest = demoCommitments
    .map((commitment) => ({ ...commitment, monthlyCents: monthlyAmountCents(commitment) }))
    .sort((a, b) => b.monthlyCents - a.monthlyCents)
    .slice(0, 5)

  return (
    <main className="min-h-svh bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <Link className="flex items-center gap-3" href="/auth/signin">
          <AppIcon className="size-9" />
          <span className="text-lg font-bold">{dictionary.appName}</span>
        </Link>
        <Button nativeButton={false} render={<Link href="/auth/signin" />} variant="outline">
          <ArrowLeftIcon data-icon="inline-start" />
          Sign in
        </Button>
      </header>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-4 md:p-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <Badge className="w-fit" variant="secondary">Mock demo</Badge>
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">{dictionary.dashboard.title}</h1>
            <p className="max-w-2xl text-muted-foreground">{dictionary.dashboard.subtitle}</p>
          </div>
        </section>

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
                  {demoCommitments.map((commitment) => (
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
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
