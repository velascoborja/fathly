"use client"

import type { Commitment, Deposit } from "@prisma/client"
import { EllipsisIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react"
import { type ReactElement, useState, useTransition } from "react"
import { toast } from "sonner"

import { BudgetDialogForm } from "@/components/budget/budget-dialog-form"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCommitmentIconOption } from "@/lib/budget/commitment-icons"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type DepositActionsProps = {
  deleteAction: () => Promise<void>
  dictionary: Dictionary
  item: Deposit
  kind: "deposit"
  updateAction: (formData: FormData) => Promise<void>
}

type CommitmentActionsProps = {
  deleteAction: () => Promise<void>
  dictionary: Dictionary
  item: Commitment
  kind: "commitment"
  updateAction: (formData: FormData) => Promise<void>
}

type BudgetRowActionProps = DepositActionsProps | CommitmentActionsProps

type BudgetRowContextMenuProps = BudgetRowActionProps & {
  children: ReactElement
}

export function BudgetRowActions(props: BudgetRowActionProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button aria-label={props.dictionary.actions.actionsMenu} size="icon-sm" type="button" variant="ghost" />}>
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            {props.dictionary.actions.edit}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
            <Trash2Icon />
            {props.dictionary.actions.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BudgetEditDialog {...props} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteConfirmDialog {...props} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}

export function BudgetRowContextMenu({ children, ...props }: BudgetRowContextMenuProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="w-36">
        <ContextMenuItem onClick={() => setEditOpen(true)}>
          <PencilIcon />
          {props.dictionary.actions.edit}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => setDeleteOpen(true)} variant="destructive">
          <Trash2Icon />
          {props.dictionary.actions.delete}
        </ContextMenuItem>
      </ContextMenuContent>
      <BudgetEditDialog {...props} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteConfirmDialog {...props} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </ContextMenu>
  )
}

function BudgetEditDialog({
  deleteAction,
  dictionary,
  item,
  kind,
  onOpenChange,
  open,
  updateAction,
}: BudgetRowActionProps & {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  if (kind === "deposit") {
    return (
      <BudgetDialogForm
        action={updateAction}
        defaults={{
          amount: item.amountCents / 100,
          name: item.name,
          notes: item.notes ?? "",
        }}
        deleteAction={deleteAction}
        dictionary={dictionary}
        kind="deposit"
        mode="edit"
        onOpenChange={onOpenChange}
        open={open}
        trigger={null}
      />
    )
  }

  const icon = getCommitmentIconOption(item.icon).value

  return (
    <BudgetDialogForm
      action={updateAction}
      defaults={{
        amount: item.amountCents / 100,
        category: item.category,
        frequency: item.frequency,
        icon,
        name: item.name,
        notes: item.notes ?? "",
        type: item.type,
      }}
      deleteAction={deleteAction}
      dictionary={dictionary}
      kind="commitment"
      mode="edit"
      onOpenChange={onOpenChange}
      open={open}
      trigger={null}
    />
  )
}

function DeleteConfirmDialog({
  deleteAction,
  dictionary,
  item,
  onOpenChange,
  open,
}: BudgetRowActionProps & {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.actions.confirmDelete}</DialogTitle>
          <DialogDescription>{dictionary.actions.deleteConfirmation.replace("{name}", item.name)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {dictionary.actions.cancel}
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteAction()
                  toast.success(dictionary.actions.deleted)
                  onOpenChange(false)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not delete.")
                }
              })
            }}
            type="button"
            variant="destructive"
          >
            {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            {dictionary.actions.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
