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
import { getDepositIconOption } from "@/lib/budget/deposit-icons"
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
  categoryOptions?: string[]
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

function BudgetEditDialog(props: BudgetRowActionProps & {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  if (props.kind === "deposit") {
    const icon = getDepositIconOption(props.item.icon).value

    return (
      <BudgetDialogForm
        action={props.updateAction}
        defaults={{
          amount: props.item.amountCents / 100,
          icon,
          name: props.item.name,
          notes: props.item.notes ?? "",
        }}
        deleteAction={props.deleteAction}
        dictionary={props.dictionary}
        kind="deposit"
        mode="edit"
        onOpenChange={props.onOpenChange}
        open={props.open}
        trigger={null}
      />
    )
  }

  const icon = getCommitmentIconOption(props.item.icon).value

  return (
    <BudgetDialogForm
      action={props.updateAction}
      categoryOptions={props.categoryOptions}
      defaults={{
        amount: props.item.amountCents / 100,
        category: props.item.category,
        frequency: props.item.frequency,
        icon,
        name: props.item.name,
        notes: props.item.notes ?? "",
        type: props.item.type,
      }}
      deleteAction={props.deleteAction}
      dictionary={props.dictionary}
      kind="commitment"
      mode="edit"
      onOpenChange={props.onOpenChange}
      open={props.open}
      trigger={null}
    />
  )
}

function DeleteConfirmDialog({
  deleteAction,
  dictionary,
  item,
  kind,
  onOpenChange,
  open,
}: BudgetRowActionProps & {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const successMessage = kind === "deposit" ? dictionary.actions.depositDeleted : dictionary.actions.commitmentDeleted

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
                  toast.success(successMessage)
                  onOpenChange(false)
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : dictionary.actions.deleteError)
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
