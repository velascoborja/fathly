"use client"

import { Loader2Icon, PencilIcon } from "lucide-react"
import { type FormEvent, useState, useTransition } from "react"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

export function CategoryRenameDialog({
  action,
  category,
  dictionary,
}: {
  action: (formData: FormData) => Promise<void>
  category: string
  dictionary: Dictionary
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError(null)
    }
    setOpen(nextOpen)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        setError(null)
        await action(formData)
        toast.success(dictionary.actions.categoryRenamed)
        setOpen(false)
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : dictionary.actions.saveError
        setError(message)
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            aria-label={`${dictionary.actions.editCategory} ${category}`}
            className="shrink-0"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dictionary.actions.renameCategory}</DialogTitle>
          <DialogDescription>{dictionary.actions.renameCategoryDescription}</DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="category-name">{dictionary.forms.category}</FieldLabel>
            <Input
              aria-invalid={Boolean(error)}
              autoComplete="off"
              defaultValue={category}
              disabled={isPending}
              id="category-name"
              key={category}
              maxLength={60}
              name="category"
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
              {dictionary.actions.cancel}
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {dictionary.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
