"use client"

import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { createContext, type ReactNode, useContext, useId, useState } from "react"

import { Button } from "@/components/ui/button"

const CategoryExpansionContext = createContext<{
  collapsed: Set<string>
  toggleCategory: (category: string) => void
  toggleAll: () => void
  allExpanded: boolean
  hasCategories: boolean
  contentId: string
  label: string
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

  function toggleCategory(category: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <CategoryExpansionContext.Provider value={{
      collapsed,
      toggleCategory,
      toggleAll: () => setCollapsed(allExpanded ? new Set(categories) : new Set()),
      allExpanded,
      hasCategories: categories.length > 0,
      contentId,
      label: allExpanded ? collapseAllLabel : expandAllLabel,
    }}>
      {children}
    </CategoryExpansionContext.Provider>
  )
}

export function CategoryExpansionToggle() {
  const expansion = useCategoryExpansion()
  if (!expansion?.hasCategories) return null
  const Icon = expansion.allExpanded ? ChevronsDownUpIcon : ChevronsUpDownIcon

  return (
    <Button
      aria-controls={expansion.contentId}
      aria-label={expansion.label}
      aria-pressed={expansion.allExpanded}
      className="max-sm:size-11"
      onClick={expansion.toggleAll}
      size="icon"
      title={expansion.label}
      type="button"
      variant="outline"
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}

export function CategoryExpansionContent({ children }: { children: ReactNode }) {
  const expansion = useCategoryExpansion()
  return <div id={expansion?.contentId}>{children}</div>
}
