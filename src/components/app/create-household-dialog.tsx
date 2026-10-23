"use client"

import { Loader2Icon } from "lucide-react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { type FormEvent, type RefObject, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { getHouseholdNameSchema } from "@/lib/validations/household"
import { createHousehold } from "@/server/household-actions"

type Dictionary = (typeof dictionaries)[Locale]

export function CreateHouseholdDialog({ dictionary, open, onOpenChange, finalFocus }: {
  dictionary: Dictionary
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocus: RefObject<HTMLSelectElement | null>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function changeOpen(nextOpen: boolean) {
    if (pending) return
    setError(null)
    onOpenChange(nextOpen)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    const parsed = getHouseholdNameSchema(dictionary.validation).safeParse(data.get("name"))
    if (!parsed.success) {
      setError(dictionary.validation.genericHouseholdNameInvalid)
      return
    }
    setError(null)
    data.set("name", parsed.data)
    startTransition(async () => {
      try {
        const result = await createHousehold(data)
        setError(result.error)
      } catch (submitError) {
        if (isRedirectError(submitError)) {
          onOpenChange(false)
          throw submitError
        }
        setError(dictionary.sharing.createHouseholdError)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent finalFocus={finalFocus} showCloseButton={!pending} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.sharing.createHousehold}</DialogTitle>
          <DialogDescription>{dictionary.sharing.createHouseholdDescription}</DialogDescription>
        </DialogHeader>
        <form aria-busy={pending} className="space-y-5" onSubmit={onSubmit}>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="new-household-name">{dictionary.settings.householdName}</FieldLabel>
            <Input
              id="new-household-name"
              name="name"
              required
              maxLength={80}
              disabled={pending}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "new-household-error" : undefined}
            />
            <FieldError id="new-household-error" role="alert">{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => changeOpen(false)}>
              {dictionary.actions.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {pending ? dictionary.sharing.creating : dictionary.sharing.createHousehold}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
