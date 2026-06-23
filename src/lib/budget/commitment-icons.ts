import type { LucideIcon } from "lucide-react"
import {
  BabyIcon,
  BanknoteIcon,
  BookOpenIcon,
  CarIcon,
  DropletsIcon,
  FlameIcon,
  Gamepad2Icon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  HomeIcon,
  PiggyBankIcon,
  PlugZapIcon,
  ReceiptTextIcon,
  RouterIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SirenIcon,
  SparklesIcon,
} from "lucide-react"

import type { Locale } from "@/lib/i18n/dictionaries"

export const commitmentIconValues = [
  "home",
  "shopping",
  "cleaning",
  "childcare",
  "school",
  "car",
  "leisure",
  "security",
  "telecom",
  "gas",
  "power",
  "water",
  "savings",
  "insurance",
  "cash",
  "books",
  "support",
  "receipt",
] as const

export type CommitmentIcon = (typeof commitmentIconValues)[number]

type CommitmentIconOption = {
  value: CommitmentIcon
  label: Record<Locale, string>
  icon: LucideIcon
  swatch: string
}

export const defaultCommitmentIcon: CommitmentIcon = "receipt"

const iconKeywordRules: { icon: CommitmentIcon; keywords: string[] }[] = [
  {
    icon: "security",
    keywords: ["alarma", "alarm", "seguridad", "security", "securitas", "prosegur", "verisure"],
  },
  {
    icon: "telecom",
    keywords: ["fibra", "fiber", "internet", "wifi", "router", "telefono", "telefonia", "phone", "mobile", "movil", "movistar", "orange", "vodafone", "o2", "digi"],
  },
  {
    icon: "insurance",
    keywords: ["seguro", "insurance", "policy", "poliza"],
  },
  {
    icon: "home",
    keywords: ["hipoteca", "mortgage", "alquiler", "rent", "casa", "hogar", "comunidad", "ibi", "property"],
  },
  {
    icon: "shopping",
    keywords: ["compra", "compras", "supermercado", "supermarket", "groceries", "alimentacion", "mercadona", "lidl", "aldi", "carrefour"],
  },
  {
    icon: "cleaning",
    keywords: ["limpieza", "cleaning", "limpiadora", "cleaner", "aseo"],
  },
  {
    icon: "childcare",
    keywords: ["guarderia", "nursery", "daycare", "ninera", "babysitter"],
  },
  {
    icon: "school",
    keywords: ["colegio", "school", "escuela", "educacion", "matricula", "tuition", "universidad", "university"],
  },
  {
    icon: "car",
    keywords: ["coche", "car", "auto", "vehiculo", "gasolina", "fuel", "parking", "garaje", "garage"],
  },
  {
    icon: "leisure",
    keywords: ["ocio", "leisure", "netflix", "spotify", "cine", "restaurant", "restaurante", "viaje", "travel", "vacaciones"],
  },
  {
    icon: "gas",
    keywords: ["gas", "calefaccion", "heating"],
  },
  {
    icon: "power",
    keywords: ["luz", "electricidad", "electric", "power", "energia", "energy", "endesa", "iberdrola"],
  },
  {
    icon: "water",
    keywords: ["agua", "water", "canal"],
  },
  {
    icon: "savings",
    keywords: ["fondo", "fund", "reserva", "reserve"],
  },
  {
    icon: "cash",
    keywords: ["efectivo", "cash", "atm", "cajero"],
  },
  {
    icon: "books",
    keywords: ["libro", "books", "book", "papeleria", "stationery"],
  },
  {
    icon: "support",
    keywords: ["familia", "family", "ayuda", "support", "cuidador", "care"],
  },
]

export const commitmentIconOptions: CommitmentIconOption[] = [
  { value: "home", label: { es: "Casa", en: "Home" }, icon: HomeIcon, swatch: "bg-primary/10 text-primary" },
  { value: "shopping", label: { es: "Compra", en: "Shopping" }, icon: ShoppingCartIcon, swatch: "bg-accent-light text-accent-dark" },
  { value: "cleaning", label: { es: "Limpieza", en: "Cleaning" }, icon: SparklesIcon, swatch: "bg-coral-light/35 text-coral-dark" },
  { value: "childcare", label: { es: "Guarderia", en: "Childcare" }, icon: BabyIcon, swatch: "bg-warning/15 text-warning" },
  { value: "school", label: { es: "Colegio", en: "School" }, icon: GraduationCapIcon, swatch: "bg-success/10 text-success" },
  { value: "car", label: { es: "Coche", en: "Car" }, icon: CarIcon, swatch: "bg-secondary/10 text-secondary" },
  { value: "leisure", label: { es: "Ocio", en: "Leisure" }, icon: Gamepad2Icon, swatch: "bg-sky-blue/15 text-primary" },
  { value: "security", label: { es: "Seguridad", en: "Security" }, icon: SirenIcon, swatch: "bg-destructive/10 text-destructive" },
  { value: "telecom", label: { es: "Fibra y telefono", en: "Fiber and phone" }, icon: RouterIcon, swatch: "bg-sky-blue/15 text-primary" },
  { value: "gas", label: { es: "Gas", en: "Gas" }, icon: FlameIcon, swatch: "bg-coral/15 text-coral-dark" },
  { value: "power", label: { es: "Luz", en: "Power" }, icon: PlugZapIcon, swatch: "bg-primary-light/15 text-primary" },
  { value: "water", label: { es: "Agua", en: "Water" }, icon: DropletsIcon, swatch: "bg-sky-blue/15 text-sky-blue" },
  { value: "savings", label: { es: "Fondo", en: "Fund" }, icon: PiggyBankIcon, swatch: "bg-accent-light text-accent-dark" },
  { value: "insurance", label: { es: "Seguro", en: "Insurance" }, icon: ShieldCheckIcon, swatch: "bg-primary-bg text-primary" },
  { value: "cash", label: { es: "Efectivo", en: "Cash" }, icon: BanknoteIcon, swatch: "bg-success/10 text-success" },
  { value: "books", label: { es: "Libros", en: "Books" }, icon: BookOpenIcon, swatch: "bg-warning/15 text-warning" },
  { value: "support", label: { es: "Familia", en: "Family" }, icon: HeartHandshakeIcon, swatch: "bg-accent-light text-accent-dark" },
  { value: "receipt", label: { es: "Recibo", en: "Receipt" }, icon: ReceiptTextIcon, swatch: "bg-muted text-primary" },
]

export function getCommitmentIconOption(value: string | null | undefined) {
  return commitmentIconOptions.find((option) => option.value === value) ?? commitmentIconOptions.at(-1)!
}

export function inferCommitmentIcon(name: string): CommitmentIcon {
  const normalizedName = normalizeIconText(name)
  const match = iconKeywordRules.find((rule) => rule.keywords.some((keyword) => normalizedName.includes(keyword)))

  return match?.icon ?? defaultCommitmentIcon
}

function normalizeIconText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}
