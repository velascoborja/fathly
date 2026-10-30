import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CollapsibleCategoryList } from "@/components/budget/collapsible-category-list"
import { CollapsibleCategoryGroup } from "@/components/budget/collapsible-category-group"
import { dictionaries } from "@/lib/i18n/dictionaries"

describe("category expansion list", () => {
  for (const locale of ["es", "en"] as const) {
    it(`starts expanded with the translated collapse action in ${locale}`, () => {
      const labels = dictionaries[locale].actions
      const groupProps = {
        category: "Casa",
        collapseLabel: labels.collapseCategory,
        expandLabel: labels.expandCategory,
        total: "100 €",
        totalLabel: "Total",
        children: "Expense",
      }
      const props = {
        categories: ["Casa"],
        collapseAllLabel: labels.collapseAllCategories,
        expandAllLabel: labels.expandAllCategories,
        children: createElement(CollapsibleCategoryGroup, groupProps),
      }
      const html = renderToStaticMarkup(createElement(CollapsibleCategoryList, props))
      expect(html).toContain(locale === "es" ? "Contraer todas" : "Collapse all")
      expect(html).toContain('aria-expanded="true"')
      expect(html).toContain("aria-controls=")
    })
  }

  it("hides the global action for an empty list", () => {
    const props = {
      categories: [], collapseAllLabel: "Contraer todas", expandAllLabel: "Expandir todas", children: "Empty",
    }
    const html = renderToStaticMarkup(createElement(CollapsibleCategoryList, props))
    expect(html).not.toContain("<button")
    expect(html).toContain("Empty")
  })
})
