import { BudgetLoading } from "@/components/app/budget-loading"
import { Skeleton } from "@/components/ui/skeleton"

export function AppShellLoading() {
  return (
    <div className="min-h-svh text-foreground" aria-busy="true">
      <div aria-hidden="true" className="border-b border-border bg-card/95">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Skeleton className="size-10 shrink-0 rounded-xl bg-primary/15" />
          <Skeleton className="h-6 w-40 rounded-full bg-muted" />
          <Skeleton className="ml-auto h-10 w-64 max-w-full rounded-full bg-muted" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        <BudgetLoading />
      </main>
    </div>
  )
}
