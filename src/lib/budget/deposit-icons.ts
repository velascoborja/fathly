import type { LucideIcon } from "lucide-react"
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CircleDollarSignIcon,
  HandCoinsIcon,
  LandmarkIcon,
  PiggyBankIcon,
  WalletCardsIcon,
} from "lucide-react"

import type { Locale } from "@/lib/i18n/dictionaries"

export const depositIconValues = [
  "income",
  "salary",
  "work",
  "cash",
  "bank",
  "savings",
  "support",
  "state-aid",
  "other",
] as const

export type DepositIcon = (typeof depositIconValues)[number]

type DepositIconOption = {
  value: DepositIcon
  label: Record<Locale, string>
  icon: LucideIcon
  swatch: string
}

export const defaultDepositIcon: DepositIcon = "income"

const iconKeywordRules: { icon: DepositIcon; keywords: string[] }[] = [
  {
    icon: "state-aid",
    keywords: [
      "ayuda",
      "ayudas",
      "estado",
      "subsidio",
      "prestacion",
      "paro",
      "sepe",
      "beca",
      "government",
      "benefit",
      "grant",
      "state aid",
      "subsidy",
    ],
  },
  {
    icon: "salary",
    keywords: ["nomina", "salary", "payroll", "sueldo", "salario"],
  },
  {
    icon: "work",
    keywords: ["freelance", "autonomo", "work", "trabajo", "factura", "invoice"],
  },
  {
    icon: "cash",
    keywords: ["efectivo", "cash", "atm", "cajero"],
  },
  {
    icon: "bank",
    keywords: ["banco", "bank", "transfer", "transferencia"],
  },
  {
    icon: "savings",
    keywords: ["ahorro", "savings", "fondo", "fund"],
  },
  {
    icon: "support",
    keywords: ["familia", "family", "support", "apoyo"],
  },
]

export const depositIconOptions: DepositIconOption[] = [
  { value: "income", label: { es: "Ingreso", en: "Income" }, icon: CircleDollarSignIcon, swatch: "bg-success/10 text-success" },
  { value: "salary", label: { es: "Nómina", en: "Salary" }, icon: WalletCardsIcon, swatch: "bg-primary/10 text-primary" },
  { value: "work", label: { es: "Trabajo", en: "Work" }, icon: BriefcaseBusinessIcon, swatch: "bg-secondary/10 text-secondary" },
  { value: "cash", label: { es: "Efectivo", en: "Cash" }, icon: BanknoteIcon, swatch: "bg-success/10 text-success" },
  { value: "bank", label: { es: "Banco", en: "Bank" }, icon: Building2Icon, swatch: "bg-sky-blue/15 text-primary" },
  { value: "savings", label: { es: "Ahorro", en: "Savings" }, icon: PiggyBankIcon, swatch: "bg-accent-light text-accent-dark" },
  { value: "support", label: { es: "Apoyo", en: "Support" }, icon: HandCoinsIcon, swatch: "bg-coral-light/35 text-coral-dark" },
  { value: "state-aid", label: { es: "Ayudas del estado", en: "State aid" }, icon: LandmarkIcon, swatch: "bg-warning/15 text-warning" },
  { value: "other", label: { es: "Otro", en: "Other" }, icon: CircleDollarSignIcon, swatch: "bg-muted text-primary" },
]

export function getDepositIconOption(value: string | null | undefined) {
  return depositIconOptions.find((option) => option.value === value) ?? depositIconOptions[0]
}

export function inferDepositIcon(name: string): DepositIcon {
  const normalizedName = normalizeIconText(name)
  const match = iconKeywordRules.find((rule) => rule.keywords.some((keyword) => normalizedName.includes(keyword)))

  return match?.icon ?? defaultDepositIcon
}

function normalizeIconText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}
