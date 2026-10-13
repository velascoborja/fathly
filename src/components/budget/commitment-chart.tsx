"use client"

import { useEffect, useRef, useState } from "react"

import type { CommitmentChartContent, CommitmentChartProps } from "@/components/budget/commitment-chart-content"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type DeferredChartProps = CommitmentChartProps & {
  loadingLabels: Pick<Dictionary["loading"], "chart" | "contentError" | "reloadPage">
}

export function CommitmentChart(props: DeferredChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [Chart, setChart] = useState<typeof CommitmentChartContent | null>(null)
  const [loadError, setLoadError] = useState(false)
  const hasData = props.data.length > 0

  useEffect(() => {
    const container = containerRef.current
    if (!container || !hasData || Chart) return

    let cancelled = false
    const loadChart = () => {
      import("@/components/budget/commitment-chart-content").then(
        (module) => {
          if (!cancelled) setChart(() => module.CommitmentChartContent)
        },
        () => {
          if (!cancelled) setLoadError(true)
        }
      )
    }

    if (!window.IntersectionObserver) {
      loadChart()
      return () => { cancelled = true }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        loadChart()
      }
    }, { rootMargin: "200px" })
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [hasData, Chart])

  if (!hasData) {
    return (
      <div className="mx-auto flex h-[clamp(240px,55vw,360px)] w-full max-w-[520px] items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
        {props.labels.noData}
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {Chart ? <Chart {...props} /> : loadError ? (
        <div className="flex h-[clamp(240px,55vw,360px)] flex-col items-center justify-center gap-3 rounded-2xl bg-muted p-4 text-center">
          <p role="alert">{props.loadingLabels.contentError}</p>
          <Button onClick={() => { setLoadError(false); window.location.reload() }} type="button" variant="outline">
            {props.loadingLabels.reloadPage}
          </Button>
        </div>
      ) : (
        <div aria-busy="true" aria-label={props.loadingLabels.chart} className="grid gap-5" role="status">
          <div aria-hidden="true" className="mx-auto flex h-[clamp(240px,55vw,360px)] w-full max-w-[520px] items-center justify-center">
            <Skeleton className="aspect-square h-4/5 rounded-full border-[2.5rem] border-primary/10 bg-transparent" />
          </div>
          <div aria-hidden="true" className="grid gap-2">
            {props.data.slice(0, 5).map((item) => <Skeleton className="h-8 rounded-full" key={item.id} />)}
          </div>
        </div>
      )}
    </div>
  )
}
