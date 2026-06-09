import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"

describe("dictionaries", () => {
  it("uses expenses nomenclature for budget commitments", () => {
    expect(dictionaries.es.dashboard.title).toBe("Resumen mensual")
    expect(dictionaries.es.dashboard.subtitle).toBe("Resumen del mes teniendo en cuenta ingresos, gastos y ahorro.")
    expect(dictionaries.es.dashboard.commitments).toBe("Gastos")
    expect(dictionaries.es.dashboard.breakdown).toBe("Distribución de gastos")
    expect(dictionaries.es.dashboard.largest).toBe("Mayores gastos")

    expect(dictionaries.en.dashboard.title).toBe("Monthly summary")
    expect(dictionaries.en.dashboard.subtitle).toBe("Review the month across income, expenses, and savings.")
    expect(dictionaries.en.dashboard.commitments).toBe("Shared expenses")
    expect(dictionaries.en.dashboard.breakdown).toBe("Expense breakdown")
    expect(dictionaries.en.dashboard.largest).toBe("Largest expenses")
  })
})
