"use client"

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { TableRow } from "@/components/ui/table"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"

const desktopPointerQuery = "(hover: hover) and (pointer: fine)"
const dragType = "application/x-fathly-commitment"
const interactiveSelector = "button, a, input, select, textarea, [role='button'], [role='menuitem'], [contenteditable='true']"

function subscribePointer(onChange: () => void) {
  const query = window.matchMedia(desktopPointerQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function hasDesktopPointer() {
  return window.matchMedia(desktopPointerQuery).matches
}

function serverPointer() {
  return false
}

type DraggedCommitment = { id: string; category: string }
type DragContext = {
  enabled: boolean
  isPending: boolean
  dragged: DraggedCommitment | null
  targetCategory: string | null
  instructionId: string
  startDrag: (item: DraggedCommitment, event: DragEvent<HTMLTableRowElement>) => void
  endDrag: () => void
  overCategory: (category: string, event: DragEvent<HTMLTableRowElement>) => void
  leaveCategory: (category: string, event: DragEvent<HTMLTableRowElement>) => void
  dropCategory: (category: string, event: DragEvent<HTMLTableRowElement>) => void
}

const CommitmentDragContext = createContext<DragContext | null>(null)

export function CommitmentCategoryDragProvider({
  children,
  canEdit,
  labels,
  moveAction,
}: {
  children: ReactNode
  canEdit: boolean
  labels: Pick<(typeof dictionaries)[Locale]["actions"], "moveCommitmentHint" | "movingCommitment" | "commitmentMoved" | "moveCommitmentError">
  moveAction: (id: string, targetCategory: string) => Promise<void>
}) {
  const desktopPointer = useSyncExternalStore(subscribePointer, hasDesktopPointer, serverPointer)
  const enabled = canEdit && desktopPointer
  const instructionId = useId()
  const [dragged, setDragged] = useState<DraggedCommitment | null>(null)
  const draggedRef = useRef<DraggedCommitment | null>(null)
  const [targetCategory, setTargetCategory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const savingRef = useRef(false)

  function endDrag() {
    draggedRef.current = null
    setDragged(null)
    setTargetCategory(null)
  }

  function canDrop(category: string, event: DragEvent<HTMLTableRowElement>) {
    return enabled && !isPending && !savingRef.current && draggedRef.current !== null &&
      draggedRef.current.category !== category && event.dataTransfer.types.includes(dragType)
  }

  const context: DragContext = {
    enabled,
    isPending,
    dragged,
    targetCategory,
    instructionId,
    startDrag(item, event) {
      if (!enabled || isPending || savingRef.current) {
        event.preventDefault()
        return
      }
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData(dragType, item.id)
      draggedRef.current = item
      setDragged(item)
    },
    endDrag,
    overCategory(category, event) {
      if (!canDrop(category, event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
      setTargetCategory(category)
    },
    leaveCategory(category, event) {
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
      setTargetCategory((current) => current === category ? null : current)
    },
    dropCategory(category, event) {
      const item = draggedRef.current
      if (!item || !canDrop(category, event)) return
      event.preventDefault()
      event.stopPropagation()
      savingRef.current = true
      endDrag()
      startTransition(async () => {
        try {
          await moveAction(item.id, category)
          toast.success(labels.commitmentMoved.replace("{category}", category))
        } catch (error) {
          toast.error(error instanceof Error ? error.message : labels.moveCommitmentError)
        } finally {
          savingRef.current = false
        }
      })
    },
  }

  return (
    <CommitmentDragContext value={context}>
      {enabled ? (
        <p className="mb-3 px-2 text-xs text-muted-foreground" id={instructionId} role="status">
          {isPending ? labels.movingCommitment : labels.moveCommitmentHint}
        </p>
      ) : null}
      <div aria-busy={isPending}>
        {children}
      </div>
    </CommitmentDragContext>
  )
}

export function DraggableCommitmentRow({
  category,
  commitmentId,
  className,
  onDragStart,
  onDragEnd,
  onPointerDownCapture,
  ...props
}: ComponentProps<typeof TableRow> & { category: string; commitmentId: string }) {
  const context = useContext(CommitmentDragContext)
  const blockedRef = useRef(false)
  const enabled = Boolean(context?.enabled && !context.isPending)
  const dragging = context?.dragged?.id === commitmentId

  return (
    <TableRow
      {...props}
      aria-describedby={enabled ? context?.instructionId : props["aria-describedby"]}
      className={cn(className, enabled && "cursor-grab active:cursor-grabbing", dragging && "opacity-40")}
      data-commitment-id={commitmentId}
      data-dragging={dragging || undefined}
      draggable={enabled}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event)
        blockedRef.current = event.pointerType === "touch" ||
          (event.target instanceof Element && Boolean(event.target.closest(interactiveSelector)))
      }}
      onDragStart={(event) => {
        onDragStart?.(event)
        if (event.defaultPrevented) return
        if (blockedRef.current || !enabled) {
          event.preventDefault()
          return
        }
        context?.startDrag({ id: commitmentId, category }, event)
      }}
      onDragEnd={(event) => {
        onDragEnd?.(event)
        context?.endDrag()
      }}
    />
  )
}

export function useCommitmentCategoryDrop(category: string, acceptDrop: boolean) {
  const context = useContext(CommitmentDragContext)
  const enabled = acceptDrop && context?.enabled

  return {
    "data-category-drop-target": enabled ? category : undefined,
    "data-drop-active": enabled && context?.targetCategory === category || undefined,
    onDragOver: enabled ? (event: DragEvent<HTMLTableRowElement>) => context.overCategory(category, event) : undefined,
    onDragLeave: enabled ? (event: DragEvent<HTMLTableRowElement>) => context.leaveCategory(category, event) : undefined,
    onDrop: enabled ? (event: DragEvent<HTMLTableRowElement>) => context.dropCategory(category, event) : undefined,
  }
}
