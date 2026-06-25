import { ArchiveIcon, ArrowDownCircleIcon, ArrowUpCircleIcon, WalletCardsIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CheckpointsLoading() {
  return (
    <section className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando checkpoints">
      <div>
        <div className="fathly-section-title flex items-center gap-2 text-3xl">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <ArchiveIcon className="size-5" />
          </span>
          <Skeleton className="h-9 w-44 rounded-full bg-primary/15" />
        </div>
        <Skeleton className="mt-3 h-4 w-full max-w-3xl rounded-full bg-muted" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-xl rounded-full bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["primary", "accent", "secondary"].map((tone) => (
          <CheckpointCardSkeleton key={tone} />
        ))}
      </div>
    </section>
  )
}

function CheckpointCardSkeleton() {
  return (
    <Card className="fathly-card border-primary/30">
      <CardHeader>
        <Skeleton className="h-7 w-3/4 rounded-full bg-primary/15" />
        <Skeleton className="h-4 w-48 max-w-full rounded-full bg-muted" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border/70 bg-muted/35 p-2">
          <CheckpointMetricSkeleton icon={<ArrowUpCircleIcon className="size-4" />} tone="income" valueWidth="w-20" />
          <CheckpointMetricSkeleton icon={<ArrowDownCircleIcon className="size-4" />} tone="expense" valueWidth="w-24" />
          <CheckpointMetricSkeleton icon={<WalletCardsIcon className="size-4" />} tone="remaining" valueWidth="w-16" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-32 rounded-full bg-primary/20" />
          <Skeleton className="size-9 rounded-full bg-destructive/15" />
        </div>
      </CardContent>
    </Card>
  )
}

function CheckpointMetricSkeleton({
  icon,
  tone,
  valueWidth,
}: {
  icon: ReactNode
  tone: "income" | "expense" | "remaining"
  valueWidth: string
}) {
  const toneClasses = {
    income: "bg-success/15 text-success",
    expense: "bg-destructive/15 text-destructive",
    remaining: "bg-primary/15 text-primary",
  }[tone]

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>{icon}</span>
        <Skeleton className="h-4 w-36 min-w-0 rounded-full bg-card" />
      </div>
      <Skeleton className={`h-6 shrink-0 rounded-full bg-card ${valueWidth}`} />
    </div>
  )
}
