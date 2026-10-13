"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import type { BudgetDialogFormProps } from "@/components/budget/budget-dialog-content"
import { DialogContentLoading } from "@/components/budget/dialog-content-loading"
import { useDeferredContent } from "@/components/budget/use-deferred-content"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const loadContent = () => import("@/components/budget/budget-dialog-content").then((module) => module.BudgetDialogContent)

export function BudgetDialogForm(props: BudgetDialogFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = props.open ?? uncontrolledOpen
  const { Content, loadError, reload } = useDeferredContent(loadContent, open)
  const setOpen = props.onOpenChange ?? setUncontrolledOpen
  const mode = props.mode ?? "create"
  const title = props.triggerLabel ?? (props.kind === "deposit"
    ? mode === "edit" ? props.dictionary.actions.editDeposit : props.dictionary.actions.addDeposit
    : mode === "edit" ? props.dictionary.actions.editCommitment : props.dictionary.actions.addBill)
  const trigger = props.trigger === undefined ? <Button /> : props.trigger

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger render={trigger}>
          <PlusIcon data-icon="inline-start" />
          {title}
        </DialogTrigger>
      )}
      <DialogContent className={props.kind === "deposit" ? "sm:max-w-lg" : "sm:max-w-2xl"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{props.dictionary.dashboard.subtitle}</DialogDescription>
        </DialogHeader>
        {open && (Content ? (
          <Content {...props} open={open} onOpenChange={setOpen} />
        ) : (
          <DialogContentLoading labels={props.dictionary.loading} loadError={loadError} reload={reload} />
        ))}
      </DialogContent>
    </Dialog>
  )
}
