"use client"

import { useState, useTransition } from "react"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { toast } from "sonner"

import { useRouter } from "next/navigation"
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
  action: (successors: Record<string, string>) => Promise<{ error: string } | void>
  transfers: { householdId: string; name: string; members: { id: string; name: string }[] }[]
  dictionary: Dictionary
}

export function AccountDeleteDialog({ action, dictionary, transfers }: AccountDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [successors, setSuccessors] = useState<Record<string, string>>({})
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger render={<Button className="min-h-11" type="button" variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        {dictionary.settings.deleteAccountAction}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.settings.deleteAccountDialogTitle}</DialogTitle>
          <DialogDescription>{dictionary.sharing.deleteHelp}</DialogDescription>
        </DialogHeader>
        {transfers.length ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{dictionary.sharing.successorHelp}</p>
            {transfers.map((transfer) => (
              <div key={transfer.householdId} className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor={`successor-${transfer.householdId}`}>
                  {transfer.name} · {dictionary.sharing.successor}
                </label>
                <select
                  id={`successor-${transfer.householdId}`}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isPending}
                  value={successors[transfer.householdId] ?? ""}
                  onChange={(event) =>
                    setSuccessors((current) => ({ ...current, [transfer.householdId]: event.target.value }))
                  }
                >
                  <option value="">{dictionary.sharing.chooseSuccessor}</option>
                  {transfer.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button className="min-h-11" disabled={isPending} type="button" variant="outline" />}>
            {dictionary.actions.cancel}
          </DialogClose>
          <Button
            className="min-h-11"
            disabled={
              isPending ||
              transfers.some(
                (transfer) => !transfer.members.some((member) => member.id === successors[transfer.householdId])
              )
            }
            onClick={() => {
              startTransition(async () => {
                try {
                  const result = await action(successors)
                  if (result?.error) {
                    toast.error(result.error)
                    router.refresh()
                  }
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
