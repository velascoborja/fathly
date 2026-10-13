import { ActivityIcon, CircleDollarSignIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { dictionaries } from "@/lib/i18n/dictionaries"

export function BudgetLoading() {
  return (
    <section data-fathly-loading className="flex flex-col gap-4" role="status" aria-busy="true" aria-label={dictionaries.es.loading.ariaLabel}>
      <span className="sr-only">{dictionaries.es.loading.ariaLabel}</span>
      <div aria-hidden="true" className="fathly-hero flex flex-col gap-6 p-5 max-sm:-mx-4 max-sm:gap-5 max-sm:rounded-none max-sm:border-0 max-sm:px-4 max-sm:py-0 max-sm:shadow-none max-sm:[background:transparent] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1">
            <Skeleton className="h-9 w-48 max-w-full rounded-full bg-primary/15 md:h-10" />
            <Skeleton className="h-5 w-full max-w-2xl rounded-full bg-muted" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full bg-primary/15" />
        </div>

        <Card className="fathly-card">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-3 lg:items-center">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {["income", "expenses"].map((metric) => (
                <div key={metric} className="flex flex-col items-center gap-3">
                  <Skeleton className="h-4 w-20 rounded-full bg-muted" />
                  <Skeleton className="h-8 w-24 rounded-full bg-primary/15" />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3 border-y border-border py-5 lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
              <Skeleton className="h-4 w-32 max-w-full rounded-full bg-muted" />
              <Skeleton className="h-12 w-36 max-w-full rounded-full bg-primary/15 md:h-15" />
              <Skeleton className="h-5 w-40 max-w-full rounded-full bg-muted" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-32 rounded-full bg-muted" />
              <Skeleton className="h-9 w-24 rounded-full bg-primary/15" />
              <Skeleton className="h-3 w-full rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(520px,1.55fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <LoadingPanel icon={<CircleDollarSignIcon className="size-5 text-success" />} rows={4} />
            <Card className="fathly-card">
              <CardHeader>
                <Skeleton className="h-6 w-40 rounded-full bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
              </CardContent>
            </Card>
          </div>
          <LoadingPanel icon={<ActivityIcon className="size-5 text-destructive" />} rows={6} className="max-lg:order-first" />
        </div>
      </div>
    </section>
  )
}

function LoadingPanel({
  icon,
  rows,
  className,
}: {
  icon: React.ReactNode
  rows: number
  className?: string
}) {
  return (
    <Card className={className ? `fathly-card ${className}` : "fathly-card"}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted">{icon}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40 max-w-full rounded-full bg-primary/15" />
            <Skeleton className="h-3 w-full max-w-sm rounded-full bg-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-2xl bg-card" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4 rounded-full bg-card" />
                <Skeleton className="h-3 w-1/2 rounded-full bg-card" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 justify-self-end rounded-full bg-card" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
