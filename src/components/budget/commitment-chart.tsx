"use client"

import { useState } from "react"
import { Cell, Pie, PieChart, Tooltip } from "recharts"

import { formatCurrency, formatWholeCurrency } from "@/lib/budget/format"
import type { Locale } from "@/lib/i18n/dictionaries"

const CHART_COLORS = [
  "#7B2FBE",
  "#FF6B9D",
  "#FF7043",
  "#FFB84D",
  "#00C4CC",
  "#5B8DEF",
  "#8D7CF6",
  "#69C779",
  "#FF9EA5",
  "#BDA7FF",
]

const COLLAPSED_LEGEND_ITEMS = 5

type CommitmentChartProps = {
  data: {
    id: string
    name: string
    amountCents: number
  }[]
  locale: Locale
  wholeCurrency?: boolean
}

export function CommitmentChart({ data, locale, wholeCurrency = false }: CommitmentChartProps) {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false)
  const formatAmount = wholeCurrency ? formatWholeCurrency : formatCurrency
  const chartData = [...data]
    .sort((firstItem, secondItem) => secondItem.amountCents - firstItem.amountCents)
    .map((item, index) => ({
      ...item,
      amount: item.amountCents / 100,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))
  const totalCents = data.reduce((sum, item) => sum + item.amountCents, 0)
  const hasCollapsibleLegend = chartData.length > COLLAPSED_LEGEND_ITEMS
  const visibleLegendItems = isLegendExpanded ? chartData : chartData.slice(0, COLLAPSED_LEGEND_ITEMS)
  const hiddenLegendItems = chartData.length - COLLAPSED_LEGEND_ITEMS
  const legendToggleLabel = isLegendExpanded
    ? locale === "en"
      ? "Show less"
      : "Mostrar menos"
    : locale === "en"
      ? `Show ${hiddenLegendItems} more`
      : `Mostrar ${hiddenLegendItems} más`

  if (!chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className="grid min-h-[320px] gap-5">
      <div className="relative min-h-[240px]">
        <PieChart
          margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
          responsive
          style={{ height: "100%", minHeight: 240, width: "100%" }}
        >
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E0D5F0",
              borderRadius: 12,
              color: "#2D2D2D",
            }}
            formatter={(value, name) => [formatAmount(Number(value) * 100, locale), name]}
            wrapperStyle={{ zIndex: 20 }}
          />
          <Pie
            cx="50%"
            cy="50%"
            data={chartData}
            dataKey="amount"
            innerRadius="52%"
            isAnimationActive={false}
            nameKey="name"
            outerRadius="86%"
            paddingAngle={2}
            stroke="#FFFFFF"
            strokeWidth={3}
          >
            {chartData.map((entry) => (
              <Cell fill={entry.fill} key={entry.id} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-card/90 px-4 py-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total</p>
            <p className="font-mono text-lg font-bold">{formatAmount(totalCents, locale)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {visibleLegendItems.map((item) => (
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm" key={item.id}>
            <span className="size-3 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="min-w-0 truncate font-medium">{item.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{formatAmount(item.amountCents, locale)}</span>
          </div>
        ))}
        {hasCollapsibleLegend ? (
          <button
            aria-expanded={isLegendExpanded}
            className="min-h-9 rounded-full border border-primary/20 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none sm:col-span-2 lg:col-span-1"
            onClick={() => setIsLegendExpanded((currentValue) => !currentValue)}
            type="button"
          >
            {legendToggleLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
