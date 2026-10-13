import { BudgetLoading } from "@/components/app/budget-loading"
import { Skeleton } from "@/components/ui/skeleton"

export function AppShellLoading() {
  return (
    <div data-fathly-loading className="min-h-svh text-foreground" aria-busy="true">
      <div aria-hidden="true" className="border-b border-border bg-card/95 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:px-6 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(360px,1fr)]">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl bg-primary/15" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-2.5 w-14 rounded-full bg-primary/15" />
              <Skeleton className="h-5 w-32 max-w-full rounded-full bg-muted" />
            </div>
          </div>
          <Skeleton className="size-10 justify-self-end rounded-full bg-muted lg:hidden" />
          <Skeleton className="col-span-2 h-11 w-full rounded-full bg-muted md:col-span-1 md:w-80 md:justify-self-center" />
          <Skeleton className="hidden h-10 w-full max-w-96 justify-self-end rounded-full bg-muted lg:block" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 md:px-6 md:py-8">
        <BudgetLoading />
      </main>
    </div>
  )
}
