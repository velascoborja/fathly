import { describe, expect, it } from "vitest"

import { dictionaries } from "@/lib/i18n/dictionaries"

describe("dictionaries", () => {
  it("uses expenses nomenclature for budget commitments", () => {
    expect(dictionaries.es.dashboard.title).toBe("Resumen mensual")
    expect(dictionaries.es.dashboard.subtitle).toBe("Resumen del mes teniendo en cuenta ingresos, gastos y ahorro.")
    expect(dictionaries.es.dashboard.covered).toBe("del presupuesto usado")
    expect(dictionaries.es.dashboard.deposits).toBe("Ingresos")
    expect(dictionaries.es.dashboard.commitments).toBe("Gastos")
    expect(dictionaries.es.dashboard.breakdown).toBe("Distribución por gasto")
    expect(dictionaries.es.dashboard.monthOutflows).toBe("Gastos")
    expect(dictionaries.es.dashboard.marginRemaining).toBe("Margen restante")
    expect(dictionaries.es.dashboard.largest).toBe("Mayores gastos")
    expect(dictionaries.es.dashboard).not.toHaveProperty("commandCenter")
    expect(dictionaries.es.monthlyBills.subtitle).toBe("Añade y revisa los gastos mensuales compartidos de la casa.")
    expect(dictionaries.es.annualCosts.subtitle).toBe("Registra los gastos anuales para prorratearlos mes a mes en el presupuesto familiar.")

    expect(dictionaries.en.dashboard.title).toBe("Monthly summary")
    expect(dictionaries.en.dashboard.subtitle).toBe("Review the month across income, expenses, and savings.")
    expect(dictionaries.en.dashboard.covered).toBe("of budget used")
    expect(dictionaries.en.dashboard.commitments).toBe("Shared expenses")
    expect(dictionaries.en.dashboard.breakdown).toBe("Breakdown by expense")
    expect(dictionaries.en.dashboard.monthOutflows).toBe("Monthly outflows")
    expect(dictionaries.en.dashboard.marginRemaining).toBe("Remaining margin")
    expect(dictionaries.en.dashboard.largest).toBe("Largest expenses")
    expect(dictionaries.en.dashboard).not.toHaveProperty("commandCenter")
    expect(dictionaries.en.monthlyBills.subtitle).toBe("Add and review the household's shared monthly expenses.")
    expect(dictionaries.en.annualCosts.subtitle).toBe("Track annual costs so they are prorated month by month in the household budget.")
  })
})
