import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AnnualProratedIndicator } from "@/components/budget/annual-prorated-indicator"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { ItemizedAmountIndicator } from "@/components/budget/itemized-amount-indicator"
import { TableCell, TableRow } from "@/components/ui/table"

describe("budget indicators", () => {
  it("keeps annual and itemized labels accessible while compacting their mobile presentation", () => {
    const annualHtml = renderToStaticMarkup(
      createElement(AnnualProratedIndicator, {
        accessibleLabel: "Gasto anual prorrateado",
        frequency: "ANNUAL",
        label: "Anual",
      })
    )
    const itemizedHtml = renderToStaticMarkup(
      createElement(ItemizedAmountIndicator, {
        accessibleLabel: "Gasto calculado como suma de partidas",
        amountMode: "ITEMIZED",
        label: "Suma",
      })
    )

    expect(annualHtml).toContain("lucide-calendar-days")
    expect(annualHtml).toContain("max-sm:hidden")
    expect(annualHtml).toContain("Gasto anual prorrateado")
    expect(itemizedHtml).toContain("max-sm:hidden")
    expect(itemizedHtml).toContain("Gasto calculado como suma de partidas")
  })
})

describe("CollapsibleCategoryGroup", () => {
  const children = createElement(
    TableRow,
    null,
    createElement(TableCell, null, "Seguro e impuestos"),
    createElement(TableCell, null, "155 €")
  )
  const baseProps = {
    category: "Casa",
    children,
    collapseLabel: "Contraer",
    expandLabel: "Expandir",
    total: "155 €",
    totalLabel: "Total",
  }

  it("supports a fixed inner table layout for compact summaries", () => {
    const html = renderToStaticMarkup(
      createElement(CollapsibleCategoryGroup, {
        ...baseProps,
        fixedTableLayout: true,
      })
    )

    expect(html).toContain("w-full caption-bottom text-sm table-fixed")
  })

  it("preserves the automatic inner table layout by default", () => {
    const html = renderToStaticMarkup(createElement(CollapsibleCategoryGroup, baseProps))

    expect(html).not.toContain("w-full caption-bottom text-sm table-fixed")
  })
})
