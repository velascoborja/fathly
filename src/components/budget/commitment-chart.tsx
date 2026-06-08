"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/budget/format"
import type { Locale } from "@/lib/i18n/dictionaries"

const colors = ["#FF9D00", "#FFD21E", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

type CommitmentChartProps = {
  data: {
    category: string
    amountCents: number
  }[]
  locale: Locale
}

export function CommitmentChart({ data, locale }: CommitmentChartProps) {
  const chartData = data.map((item, index) => ({
    category: item.category,
    amount: item.amountCents / 100,
    fill: colors[index % colors.length],
  }))
  const config = data.reduce<ChartConfig>((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: colors[index % colors.length],
    }
    return acc
  }, {})

  if (!chartData.length) {
    return <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">No data</div>
  }

  return (
    <ChartContainer className="mx-auto aspect-square max-h-[280px]" config={config}>
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-mono">{`${name}: ${formatCurrency(Number(value) * 100, locale)}`}</span>
              )}
              hideLabel
            />
          }
        />
        <Pie data={chartData} dataKey="amount" innerRadius={58} nameKey="category" strokeWidth={0}>
          {chartData.map((entry) => (
            <Cell fill={entry.fill} key={entry.category} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
