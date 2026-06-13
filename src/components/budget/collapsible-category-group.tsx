"use client"

import { ChevronDownIcon } from "lucide-react"
import { type ReactNode, useState } from "react"

import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function CollapsibleCategoryGroup({
  actionColumn = false,
  category,
  children,
  collapseLabel,
  expandLabel,
  extraTrailingCells = 0,
  leadingColSpan,
  total,
  totalClassName,
  totalLabel,
}: {
  actionColumn?: boolean
  category: string
  children: ReactNode
  collapseLabel: string
  expandLabel: string
  extraTrailingCells?: number
  leadingColSpan?: number
  total: string
  totalClassName?: string
  totalLabel: string
}) {
  const [expanded, setExpanded] = useState(true)
  const toggleLabel = `${expanded ? collapseLabel : expandLabel} ${category}`
  const totalCellIsLast = !actionColumn && extraTrailingCells === 0

  return (
    <>
      <TableRow
        aria-expanded={expanded}
        className="border-0 bg-transparent hover:bg-transparent has-aria-expanded:bg-transparent"
      >
        <TableCell
          className="rounded-l-2xl bg-muted/70 py-2 pr-0 pl-2 font-semibold text-foreground"
          colSpan={leadingColSpan}
        >
          <button
            aria-expanded={expanded}
            aria-label={toggleLabel}
            className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-2 text-left outline-none transition-colors hover:bg-muted/80 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/30"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-muted text-primary">
              <ChevronDownIcon className={`size-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
            </span>
            <span className="truncate">{category}</span>
          </button>
        </TableCell>
        <TableCell
          className={cn(
            "w-44 bg-muted/70 py-2 pr-2 pl-0 text-right",
            totalCellIsLast && "rounded-r-2xl"
          )}
        >
          <span className="inline-flex items-center justify-end gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 whitespace-nowrap">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-destructive/80">
              {totalLabel}
            </span>
            <span className={cn("font-mono font-semibold", totalClassName)}>{total}</span>
          </span>
        </TableCell>
        {Array.from({ length: extraTrailingCells }, (_, index) => (
          <TableCell
            className={cn(
              "bg-muted/70 p-0",
              !actionColumn && index === extraTrailingCells - 1 && "rounded-r-2xl"
            )}
            key={index}
          />
        ))}
        {actionColumn && (
          <TableCell className="w-9 rounded-r-2xl bg-muted/70 p-0" />
        )}
      </TableRow>
      {expanded && children}
    </>
  )
}
