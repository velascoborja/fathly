"use client"

import { Cell, Pie, PieChart, Tooltip } from "recharts"

import { formatCurrency } from "@/lib/budget/format"
import type { Locale } from "@/lib/i18n/dictionaries"

const colors = ["#2BA8A2", "#FFD23F", "#EF6C4A", "#5DADE2", "#27AE60", "#FFE47A"]

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
  if (!chartData.length) {
    return <div className="flex aspect-video items-center justify-center rounded-3xl bg-cream text-sm font-bold text-muted-foreground">No data</div>
  }

  return (
    <div className="mx-auto flex h-[280px] w-full max-w-[320px] items-center justify-center">
      <PieChart height={280} width={280}>
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(Number(value) * 100, locale),
            name,
          ]}
        />
        <Pie
          cx="50%"
          cy="50%"
          data={chartData}
          dataKey="amount"
          innerRadius={62}
          isAnimationActive={false}
          nameKey="category"
          outerRadius={108}
          strokeWidth={0}
        >
          {chartData.map((entry) => (
            <Cell fill={entry.fill} key={entry.category} />
          ))}
        </Pie>
      </PieChart>
    </div>
  )
}
