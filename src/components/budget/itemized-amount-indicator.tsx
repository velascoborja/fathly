import { SquareSigmaIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function ItemizedAmountIndicator({
  accessibleLabel,
  amountMode,
  label,
}: {
  accessibleLabel: string
  amountMode: "FIXED" | "ITEMIZED"
  label: string
}) {
  if (amountMode !== "ITEMIZED") {
    return null
  }

  return (
    <Badge
      className="gap-1 border-primary/20 bg-primary/10 text-primary"
      title={accessibleLabel}
      variant="outline"
    >
      <SquareSigmaIcon aria-hidden="true" className="size-3.5" />
      <span aria-hidden="true" className="max-sm:hidden">{label}</span>
      <span className="sr-only">{accessibleLabel}</span>
    </Badge>
  )
}
