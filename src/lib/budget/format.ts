import type { Locale } from "@/lib/i18n/dictionaries"

export function formatCurrency(cents: number, locale: Locale = "es") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export function centsFromDecimalInput(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value.replace(",", "."))

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.round(numericValue * 100)
}
