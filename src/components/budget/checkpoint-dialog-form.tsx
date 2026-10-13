"use client"

import { useState } from "react"
import { ArchiveIcon } from "lucide-react"

import type { CheckpointDialogFormProps } from "@/components/budget/checkpoint-dialog-content"
import { DialogContentLoading } from "@/components/budget/dialog-content-loading"
import { useDeferredContent } from "@/components/budget/use-deferred-content"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const loadContent = () => import("@/components/budget/checkpoint-dialog-content").then((module) => module.CheckpointDialogContent)

export function CheckpointDialogForm({ action, dictionary }: CheckpointDialogFormProps) {
  const [open, setOpen] = useState(false)
  const { Content, loadError, reload } = useDeferredContent(loadContent, open)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <ArchiveIcon data-icon="inline-start" />
        {dictionary.checkpoints.createAction}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dictionary.checkpoints.createTitle}</DialogTitle>
          <DialogDescription>{dictionary.checkpoints.createDescription}</DialogDescription>
        </DialogHeader>
        {open && (Content ? (
          <Content action={action} dictionary={dictionary} onOpenChange={setOpen} />
        ) : (
          <DialogContentLoading labels={dictionary.loading} loadError={loadError} reload={reload} />
        ))}
      </DialogContent>
    </Dialog>
  )
}
