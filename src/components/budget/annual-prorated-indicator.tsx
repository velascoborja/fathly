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
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{accessibleLabel}</span>
    </Badge>
  )
}
