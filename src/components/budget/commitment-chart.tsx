"use client"

import { useState } from "react"
import { Cell, Pie, PieChart, Sector, Tooltip } from "recharts"
import type { PieLabelRenderProps, PieSectorShapeProps } from "recharts"

import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
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
const ICON_LABEL_MIN_PERCENT = 0.12
const ICON_LABEL_SIZE = 24
const ICON_LABEL_HALF_SIZE = ICON_LABEL_SIZE / 2
const ICON_LABEL_RADIUS_RATIO = 0.5
const ACTIVE_SLICE_RADIUS_OFFSET = 8
const RADIAN = Math.PI / 180

type CommitmentChartProps = {
  data: {
    id: string
    icon?: string | null
    name: string
    amountCents: number
  }[]
  labels: {
    noData: string
    showLess: string
    showMore: string
  }
  locale: Locale
  wholeCurrency?: boolean
}

export function CommitmentChart({ data, labels, locale, wholeCurrency = false }: CommitmentChartProps) {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false)
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const formatAmount = wholeCurrency ? formatWholeCurrency : formatCurrency
  const chartData = [...data]
    .sort((firstItem, secondItem) => secondItem.amountCents - firstItem.amountCents)
    .map((item, index) => ({
      ...item,
      amount: item.amountCents / 100,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      Icon: getCommitmentIconOption(item.icon).icon,
    }))
  const totalCents = data.reduce((sum, item) => sum + item.amountCents, 0)
  const hasCollapsibleLegend = chartData.length > COLLAPSED_LEGEND_ITEMS
  const visibleLegendItems = isLegendExpanded ? chartData : chartData.slice(0, COLLAPSED_LEGEND_ITEMS)
  const hiddenLegendItems = chartData.length - COLLAPSED_LEGEND_ITEMS
  const legendToggleLabel = isLegendExpanded
    ? labels.showLess
    : labels.showMore.replace("{count}", String(hiddenLegendItems))
  const activeItemIndex = hoveredItemIndex ?? selectedItemIndex

  if (!chartData.length) {
    return (
      <div className="mx-auto flex h-[clamp(240px,55vw,360px)] w-full max-w-[520px] items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
        {labels.noData}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="relative mx-auto h-[clamp(240px,55vw,360px)] w-full max-w-[520px] [&_.recharts-pie-sector]:outline-none [&_.recharts-pie]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none">
        <PieChart
          margin={{ bottom: 12, left: 12, right: 12, top: 12 }}
          responsive
          style={{ height: "100%", width: "100%" }}
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
            innerRadius="60%"
            isAnimationActive={false}
            label={renderCommitmentIconLabel}
            labelLine={false}
            nameKey="name"
            outerRadius="94%"
            paddingAngle={2}
            rootTabIndex={-1}
            shape={(props, index) =>
              renderCommitmentSector(props, index === activeItemIndex, {
                onClick: () => {
                  setSelectedItemIndex((currentItemIndex) => (currentItemIndex === index ? null : index))
                },
                onMouseEnter: () => {
                  setHoveredItemIndex(index)
                },
                onMouseLeave: () => {
                  setHoveredItemIndex(null)
                },
              })
            }
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

function renderCommitmentSector(
  props: PieSectorShapeProps,
  isActive: boolean,
  eventHandlers: Pick<React.ComponentProps<typeof Sector>, "onClick" | "onMouseEnter" | "onMouseLeave">
) {
  return (
    <Sector
      {...props}
      {...eventHandlers}
      className="cursor-pointer outline-none transition-[filter,stroke-width] duration-200 motion-reduce:transition-none"
      outerRadius={isActive ? props.outerRadius + ACTIVE_SLICE_RADIUS_OFFSET : props.outerRadius}
      stroke="#FFFFFF"
      strokeWidth={isActive ? 5 : 3}
      style={{
        filter: isActive ? "drop-shadow(0 6px 10px rgba(45, 45, 45, 0.18))" : undefined,
      }}
    />
  )
}

function renderCommitmentIconLabel(props: PieLabelRenderProps) {
  const percent = typeof props.percent === "number" ? props.percent : 0

  if (percent < ICON_LABEL_MIN_PERCENT) {
    return null
  }

  const payload = props.payload as
    | { Icon?: React.ComponentType<{ color?: string; height?: number; strokeWidth?: number; style?: React.CSSProperties; width?: number }> }
    | undefined
  const Icon = payload?.Icon
  const cx = Number(props.cx)
  const cy = Number(props.cy)
  const innerRadius = Number(props.innerRadius)
  const outerRadius = Number(props.outerRadius)
  const midAngle = Number(props.midAngle)

  if (
    !Icon ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(innerRadius) ||
    !Number.isFinite(outerRadius) ||
    !Number.isFinite(midAngle)
  ) {
    return null
  }

  const radius = clamp(
    innerRadius + (outerRadius - innerRadius) * ICON_LABEL_RADIUS_RATIO,
    innerRadius + ICON_LABEL_HALF_SIZE,
    outerRadius - ICON_LABEL_HALF_SIZE
  )
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <g className="pointer-events-none" transform={`translate(${x - ICON_LABEL_HALF_SIZE} ${y - ICON_LABEL_HALF_SIZE})`}>
      <Icon
        color="#FFFFFF"
        height={ICON_LABEL_SIZE}
        strokeWidth={2.8}
        style={{ filter: "drop-shadow(0 1px 2px rgba(45, 45, 45, 0.35))" }}
        width={ICON_LABEL_SIZE}
      />
    </g>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
