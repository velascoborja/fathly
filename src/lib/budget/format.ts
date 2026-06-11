import type { Locale } from "@/lib/i18n/dictionaries"

export function formatCurrency(cents: number, locale: Locale = "es") {
  return formatEuro(cents, locale, {
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  })
}

export function formatWholeCurrency(cents: number, locale: Locale = "es") {
  return formatEuro(cents, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatBudgetUsagePercent(ratio: number, locale: Locale = "es") {
  const percentage = Math.max(0, ratio) * 100
  const roundedPercentage = Math.round(percentage)

  if (ratio > 0 && ratio < 1 && roundedPercentage >= 100) {
    return `${formatNumber(Math.floor(percentage * 10) / 10, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`
  }

  return `${roundedPercentage}%`
}

function formatEuro(cents: number, locale: Locale, options: Intl.NumberFormatOptions) {
  const formatter = new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: "EUR",
    ...options,
  })

  if (locale !== "es") {
    return formatter.format(cents / 100)
  }

  return formatter
    .formatToParts(cents / 100)
    .filter((part, index, parts) => !(part.type === "literal" && parts[index + 1]?.type === "currency"))
    .map((part) => part.value)
    .join("")
}

function formatNumber(value: number, locale: Locale, options: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", options).format(value)
}

export function centsFromDecimalInput(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value.replace(",", "."))

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.round(numericValue * 100)
}
