import { ActivityIcon, SettingsIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppLoading() {
  return (
    <section className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <div className="fathly-hero flex flex-col gap-6 p-5 md:p-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-48 rounded-full bg-primary/15 md:h-10" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-full bg-muted" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {["primary", "accent", "secondary"].map((tone) => (
            <Card key={tone} className="fathly-card border-primary/20 bg-card/85">
              <CardContent className="flex flex-col gap-3 p-5">
                <Skeleton className="h-4 w-24 rounded-full bg-muted" />
                <Skeleton className="h-9 w-32 rounded-full bg-primary/15" />
                <Skeleton className="h-3 w-full rounded-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(520px,1.55fr)]">
          <LoadingPanel icon={<SettingsIcon className="size-5 text-primary" />} rows={4} />
          <LoadingPanel icon={<ActivityIcon className="size-5 text-destructive" />} rows={6} wide />
        </div>
      </div>
    </section>
  )
}

function LoadingPanel({
  icon,
  rows,
  wide = false,
}: {
  icon: React.ReactNode
  rows: number
  wide?: boolean
}) {
  return (
    <Card className="fathly-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted">{icon}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40 rounded-full bg-primary/15" />
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

        {wide ? (
          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-[20px] bg-muted" />
            <Skeleton className="h-28 rounded-[20px] bg-muted" />
            <Skeleton className="h-28 rounded-[20px] bg-muted" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
