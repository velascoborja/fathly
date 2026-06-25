"use client"

import { Loader2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type CheckpointDeleteDialogProps = {
  action: () => Promise<void>
  checkpointName: string
  dictionary: Dictionary
  iconOnly?: boolean
  redirectTo?: string
}

export function CheckpointDeleteDialog({
  action,
  checkpointName,
  dictionary,
  iconOnly = false,
  redirectTo,
}: CheckpointDeleteDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            aria-label={dictionary.checkpoints.deleteAction}
            size={iconOnly ? "icon" : "sm"}
            type="button"
            variant="destructive"
          />
        }
      >
        <Trash2Icon data-icon={iconOnly ? undefined : "inline-start"} />
        {!iconOnly && dictionary.checkpoints.deleteAction}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.checkpoints.deleteTitle}</DialogTitle>
          <DialogDescription>{dictionary.checkpoints.deleteDescription.replace("{name}", checkpointName)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
            {dictionary.actions.cancel}
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await action()
                  toast.success(dictionary.checkpoints.deleted)
                  setOpen(false)

                  if (redirectTo) {
                    router.push(redirectTo)
                    return
                  }

                  router.refresh()
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : dictionary.checkpoints.deleteError)
                }
              })
            }}
            type="button"
            variant="destructive"
          >
            {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            {dictionary.checkpoints.deleteAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
