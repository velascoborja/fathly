"use client"

import { useTransition } from "react"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type AccountDeleteDialogProps = {
  action: () => Promise<void>
  dictionary: Dictionary
}

export function AccountDeleteDialog({ action, dictionary }: AccountDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        {dictionary.settings.deleteAccountAction}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.settings.deleteAccountDialogTitle}</DialogTitle>
          <DialogDescription>{dictionary.settings.deleteAccountDialogDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button disabled={isPending} type="button" variant="outline" />}>
            {dictionary.actions.cancel}
          </DialogClose>
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await action()
                } catch (error) {
                  if (isRedirectError(error)) {
                    throw error
                  }

                  toast.error(error instanceof Error ? error.message : dictionary.settings.deleteAccountError)
                }
              })
            }}
            type="button"
            variant="destructive"
          >
            {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            {isPending ? dictionary.settings.deletingAccount : dictionary.settings.confirmDeleteAccountAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
