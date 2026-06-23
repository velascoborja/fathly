import { Progress } from "@/components/ui/progress"
import { formatLowMonthlyMarginPercent } from "@/lib/budget/math"
import { cn } from "@/lib/utils"

type CoverageProgressProps = {
  className?: string
  lowMonthlyMarginBasisPoints: number
  markerLabel: string
  markerShortLabel: string
  tone: "shortfall" | "warning" | "surplus"
  value: number
}

export function CoverageProgress({
  className,
  lowMonthlyMarginBasisPoints,
  markerLabel,
  markerShortLabel,
  tone,
  value,
}: CoverageProgressProps) {
  const marginPercent = lowMonthlyMarginBasisPoints / 100
  const markerPercent = Math.min(Math.max(100 - marginPercent, 0), 100)
  const formattedMargin = formatLowMonthlyMarginPercent(lowMonthlyMarginBasisPoints)
  const markerLabelAlignmentClass =
    markerPercent > 85 ? "self-end" : markerPercent < 15 ? "self-start" : "self-center"

  return (
    <div className={cn("relative pt-8", className)}>
      <Progress
        aria-describedby="coverage-margin-marker"
        className={cn(
          "[&_[data-slot=progress-track]]:h-4 [&_[data-slot=progress-track]]:bg-border",
          tone === "shortfall"
            ? "[&_[data-slot=progress-indicator]]:bg-destructive"
            : tone === "warning"
              ? "[&_[data-slot=progress-indicator]]:bg-warning"
              : "[&_[data-slot=progress-indicator]]:bg-primary"
        )}
        value={value}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 flex w-0 flex-col items-center"
        data-slot="coverage-margin-marker"
        style={{ left: `${markerPercent}%` }}
      >
        <span
          className={cn(
            "mb-1 whitespace-nowrap rounded-full border border-border/70 bg-card/90 px-2 py-0.5 text-[0.65rem] font-bold leading-none text-muted-foreground shadow-sm",
            markerLabelAlignmentClass
          )}
        >
          {markerShortLabel} {formattedMargin}
        </span>
        <span className="h-2 w-px rounded-full bg-foreground/35" />
        <span className="mt-0.5 size-2 rounded-full border border-white bg-foreground/35 shadow-sm" />
      </div>
      <p id="coverage-margin-marker" className="sr-only">
        {markerLabel}: {formattedMargin}
      </p>
    </div>
  )
}
