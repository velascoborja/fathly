import { CalendarDaysIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function AnnualProratedIndicator({
  accessibleLabel,
  frequency,
  label,
}: {
  accessibleLabel: string
  frequency: "MONTHLY" | "ANNUAL"
  label: string
}) {
  if (frequency !== "ANNUAL") {
    return null
  }

  return (
    <Badge
      className="border-primary/20 bg-primary/10 text-primary"
      title={accessibleLabel}
      variant="outline"
    >
      <CalendarDaysIcon aria-hidden="true" className="size-3.5 sm:hidden" />
      <span aria-hidden="true" className="max-sm:hidden">{label}</span>
      <span className="sr-only">{accessibleLabel}</span>
    </Badge>
  )
}
