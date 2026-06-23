"use client"

import { ChevronDownIcon } from "lucide-react"
import { type ReactNode, useId, useState } from "react"

import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function CollapsibleCategoryGroup({
  actionColumn = false,
  category,
  categoryAction,
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
  categoryAction?: ReactNode
  children: ReactNode
  collapseLabel: string
  expandLabel: string
  extraTrailingCells?: number
  leadingColSpan?: number
  total: string
  totalClassName?: string
  totalLabel: string
}) {
  const contentId = useId()
  const [expanded, setExpanded] = useState(true)
  const toggleLabel = `${expanded ? collapseLabel : expandLabel} ${category}`
  const totalColSpan = actionColumn ? 2 + extraTrailingCells : 1
  const totalCellIsLast = actionColumn || extraTrailingCells === 0
  const groupColSpan = (leadingColSpan ?? 1) + totalColSpan + (actionColumn ? 0 : extraTrailingCells)

  return (
    <>
      <TableRow
        aria-expanded={expanded}
        className="fathly-row-hover-transparent border-0 bg-transparent"
      >
        <TableCell
          className="rounded-l-2xl bg-muted/70 py-2 pr-0 pl-2 font-semibold text-foreground"
          colSpan={leadingColSpan}
        >
          <div className="flex min-w-0 items-center gap-1">
            <button
              aria-controls={contentId}
              aria-expanded={expanded}
              aria-label={toggleLabel}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-left outline-none transition-colors hover:bg-muted/80 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/30"
              onClick={() => setExpanded((current) => !current)}
              type="button"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-muted text-primary">
                <ChevronDownIcon className={`size-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
              </span>
              <span className="truncate">{category}</span>
            </button>
            {categoryAction}
          </div>
        </TableCell>
        <TableCell
          className={cn(
            "w-44 bg-muted/70 py-2 pr-2 pl-0 text-right max-sm:relative max-sm:w-28 max-sm:pl-1",
            totalCellIsLast && "rounded-r-2xl"
          )}
          colSpan={totalColSpan}
        >
          <span className="inline-flex items-center justify-end gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 whitespace-nowrap max-sm:absolute max-sm:top-1/2 max-sm:right-3 max-sm:-translate-y-1/2 max-sm:gap-1 max-sm:px-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-destructive/80 max-sm:text-[0.6rem] max-sm:tracking-[0.08em]">
              {totalLabel}
            </span>
            <span className={cn("font-mono font-semibold max-sm:text-[0.8rem]", totalClassName)}>{total}</span>
          </span>
        </TableCell>
        {!actionColumn && Array.from({ length: extraTrailingCells }, (_, index) => (
          <TableCell
            className={cn(
              "bg-muted/70 p-0",
              !actionColumn && index === extraTrailingCells - 1 && "rounded-r-2xl"
            )}
            key={index}
          />
        ))}
      </TableRow>
      <TableRow className="fathly-row-hover-transparent border-0 bg-transparent">
        <TableCell className="p-0" colSpan={groupColSpan}>
          <div
            aria-hidden={!expanded}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
            id={contentId}
            inert={!expanded ? true : undefined}
          >
            <div className="min-h-0 overflow-hidden">
              <table className="w-full caption-bottom text-sm">
                <TableBody>{children}</TableBody>
              </table>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  )
}
