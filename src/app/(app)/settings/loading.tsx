import { SettingsIcon, UsersIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <section className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando ajustes">
      <div>
        <div className="fathly-section-title flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <SettingsIcon className="size-5" />
          </span>
          <Skeleton className="h-9 w-36 rounded-full bg-primary/15" />
        </div>
      </div>

      <SettingsCard accentClassName="border-primary/40" fields={1} />
      <SettingsCard accentClassName="border-accent/40" fields={2} icon={<UsersIcon className="size-5 text-primary" />} memberRows={3} />
      <SettingsCard accentClassName="border-warning/40" fields={1} />
    </section>
  )
}

function SettingsCard({
  accentClassName,
  fields,
  icon,
  memberRows = 0,
}: {
  accentClassName: string
  fields: number
  icon?: React.ReactNode
  memberRows?: number
}) {
  return (
    <Card className={`fathly-card ${accentClassName}`}>
      <CardHeader>
        <div className="flex items-start gap-2">
          {icon}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-56 max-w-full rounded-full bg-primary/15" />
            <Skeleton className="h-4 w-full max-w-lg rounded-full bg-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40 rounded-full bg-muted" />
            <Skeleton className="h-11 w-full rounded-[16px] bg-muted" />
            <Skeleton className="h-3 w-full max-w-md rounded-full bg-muted" />
          </div>
        ))}

        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-full bg-primary/20" />
        </div>

        {memberRows > 0 ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {Array.from({ length: memberRows }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full bg-card" />
                  <Skeleton className="h-4 w-48 max-w-full rounded-full bg-card" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-full bg-card" />
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
