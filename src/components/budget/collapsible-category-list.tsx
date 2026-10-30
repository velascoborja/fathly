"use client"

import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { createContext, type ReactNode, useContext, useId, useState } from "react"

import { Button } from "@/components/ui/button"

const CategoryExpansionContext = createContext<{
  collapsed: Set<string>
  toggleCategory: (category: string) => void
} | null>(null)

export function useCategoryExpansion() {
  return useContext(CategoryExpansionContext)
}

export function CollapsibleCategoryList({
  categories,
  children,
  collapseAllLabel,
  expandAllLabel,
}: {
  categories: string[]
  children: ReactNode
  collapseAllLabel: string
  expandAllLabel: string
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const contentId = useId()
  const allExpanded = categories.every((category) => !collapsed.has(category))
  const Icon = allExpanded ? ChevronsDownUpIcon : ChevronsUpDownIcon

  function toggleCategory(category: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <CategoryExpansionContext.Provider value={{ collapsed, toggleCategory }}>
      {categories.length > 0 && (
        <div className="mb-3 flex justify-end">
          <Button
            aria-controls={contentId}
            className="min-h-11"
            onClick={() => setCollapsed(allExpanded ? new Set(categories) : new Set())}
            type="button"
            variant="outline"
          >
            <Icon aria-hidden="true" />
            {allExpanded ? collapseAllLabel : expandAllLabel}
          </Button>
        </div>
      )}
      <div id={contentId}>{children}</div>
    </CategoryExpansionContext.Provider>
  )
}
