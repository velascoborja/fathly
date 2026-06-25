import Link from "next/link"
import { ArchiveIcon, ArrowDownCircleIcon, ArrowRightIcon, ArrowUpCircleIcon, WalletCardsIcon } from "lucide-react"
import type { ReactNode } from "react"

import { CheckpointDeleteDialog } from "@/components/budget/checkpoint-delete-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { calculateBudgetSummary } from "@/lib/budget/math"
import { formatWholeCurrency } from "@/lib/budget/format"
import { getLocale, getServerDictionary } from "@/lib/i18n/server"
import { deleteCheckpoint } from "@/server/actions"
import { getCheckpoints } from "@/server/household"
import type { Locale } from "@/lib/i18n/dictionaries"

export const dynamic = "force-dynamic"

export default async function CheckpointsPage() {
  const [data, dictionary, locale] = await Promise.all([getCheckpoints(), getServerDictionary(), getLocale()])

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="fathly-section-title flex items-center gap-2 text-3xl">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <ArchiveIcon className="size-5" />
          </span>
          {dictionary.checkpoints.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{dictionary.checkpoints.subtitle}</p>
      </div>

      {data.checkpoints.length === 0 ? (
        <Card className="fathly-card">
          <CardContent className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{dictionary.checkpoints.emptyTitle}</EmptyTitle>
                <EmptyDescription>{dictionary.checkpoints.emptyBody}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.checkpoints.map((checkpoint) => {
            const summary = calculateBudgetSummary(checkpoint.deposits, checkpoint.commitments)

            return (
              <Card className="fathly-card border-primary/30" key={checkpoint.id}>
                <CardHeader>
                  <CardTitle className="truncate text-2xl">{checkpoint.name}</CardTitle>
                  <CardDescription>
                    {dictionary.checkpoints.snapshotDate}: {formatDate(checkpoint.createdAt, locale)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/35 p-2">
                    <CheckpointMetric
                      icon={<ArrowUpCircleIcon className="size-4" />}
                      label={dictionary.checkpoints.monthlyDeposits}
                      tone="income"
                      value={formatWholeCurrency(summary.monthlyDepositsCents, locale)}
                    />
                    <CheckpointMetric
                      icon={<ArrowDownCircleIcon className="size-4" />}
                      label={dictionary.checkpoints.monthlyOutflows}
                      tone="expense"
                      value={formatWholeCurrency(summary.monthlyCommitmentsCents, locale)}
                    />
                    <CheckpointMetric
                      icon={<WalletCardsIcon className="size-4" />}
                      label={dictionary.checkpoints.monthlyRemaining}
                      tone={summary.coverageCents < 0 ? "negative" : "remaining"}
                      value={formatWholeCurrency(summary.coverageCents, locale)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Button className="self-start" nativeButton={false} render={<Link href={`/checkpoints/${checkpoint.id}`} />} size="sm">
                      {dictionary.checkpoints.viewDetails}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                    <CheckpointDeleteDialog
                      action={deleteCheckpoint.bind(null, checkpoint.id)}
                      checkpointName={checkpoint.name}
                      dictionary={dictionary}
                      iconOnly
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

type CheckpointMetricTone = "income" | "expense" | "remaining" | "negative"

const checkpointMetricToneClasses: Record<CheckpointMetricTone, { icon: string; row: string; value: string }> = {
  income: {
    icon: "bg-success/15 text-success",
    row: "hover:bg-success/10",
    value: "text-success",
  },
  expense: {
    icon: "bg-destructive/15 text-destructive",
    row: "hover:bg-destructive/10",
    value: "text-destructive",
  },
  remaining: {
    icon: "bg-primary/15 text-primary",
    row: "bg-primary/10",
    value: "text-primary",
  },
  negative: {
    icon: "bg-destructive/15 text-destructive",
    row: "bg-destructive/10",
    value: "text-destructive",
  },
}

function CheckpointMetric({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode
  label: string
  tone: CheckpointMetricTone
  value: string
}) {
  const toneClasses = checkpointMetricToneClasses[tone]

  return (
    <div className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${toneClasses.row}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneClasses.icon}`}>{icon}</span>
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className={`shrink-0 font-mono text-lg font-bold ${toneClasses.value}`}>{value}</p>
    </div>
  )
}

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "medium",
  }).format(date)
}
