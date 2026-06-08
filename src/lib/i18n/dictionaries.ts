export const locales = ["es", "en"] as const
export type Locale = (typeof locales)[number]

export const dictionaries = {
  es: {
    appName: "Fathly",
    household: "Casa familiar",
    nav: {
      dashboard: "Panel",
      deposits: "Ingresos",
      monthlyBills: "Gastos mensuales",
      annualCosts: "Gastos anuales",
      savings: "Ahorro",
      settings: "Ajustes",
    },
    actions: {
      addBill: "Añadir gasto",
      addDeposit: "Añadir ingreso",
      adjustDeposits: "Ajustar ingresos",
      save: "Guardar",
      signIn: "Entrar con Google",
      signOut: "Salir",
      switchToEnglish: "English",
      switchToSpanish: "Español",
    },
    dashboard: {
      title: "Cuenta compartida mensual",
      subtitle: "Comprueba si lo que ingresáis cada mes cubre todos los compromisos del hogar.",
      covered: "Cubierto por",
      shortBy: "Faltan",
      deposits: "Ingresos mensuales",
      commitments: "Compromisos",
      annual: "Anuales prorrateados",
      savings: "Ahorro asignado",
      remaining: "margen restante",
      breakdown: "Distribución de compromisos",
      largest: "Mayores compromisos",
      emptyTitle: "Empieza con vuestros ingresos compartidos",
      emptyBody: "Añade lo que cada persona ingresa en la cuenta común y después registra facturas, gastos anuales y ahorro.",
    },
    forms: {
      name: "Nombre",
      amount: "Importe",
      category: "Categoría",
      frequency: "Frecuencia",
      type: "Tipo",
      notes: "Notas",
      monthly: "Mensual",
      annual: "Anual",
      bill: "Gasto",
      savings: "Ahorro",
    },
  },
  en: {
    appName: "Fathly",
    household: "Household",
    nav: {
      dashboard: "Dashboard",
      deposits: "Deposits",
      monthlyBills: "Monthly bills",
      annualCosts: "Annual costs",
      savings: "Savings",
      settings: "Settings",
    },
    actions: {
      addBill: "Add bill",
      addDeposit: "Add deposit",
      adjustDeposits: "Adjust deposits",
      save: "Save",
      signIn: "Sign in with Google",
      signOut: "Sign out",
      switchToEnglish: "English",
      switchToSpanish: "Español",
    },
    dashboard: {
      title: "Monthly shared account",
      subtitle: "See whether your monthly shared-account deposits cover every household commitment.",
      covered: "Covered by",
      shortBy: "Short by",
      deposits: "Monthly deposits",
      commitments: "Shared commitments",
      annual: "Annual costs prorated",
      savings: "Savings allocations",
      remaining: "remaining",
      breakdown: "Commitment breakdown",
      largest: "Largest commitments",
      emptyTitle: "Start with shared deposits",
      emptyBody: "Add what each person puts into the shared account, then register bills, annual costs, and savings.",
    },
    forms: {
      name: "Name",
      amount: "Amount",
      category: "Category",
      frequency: "Frequency",
      type: "Type",
      notes: "Notes",
      monthly: "Monthly",
      annual: "Annual",
      bill: "Bill",
      savings: "Savings",
    },
  },
} as const

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en"
}
