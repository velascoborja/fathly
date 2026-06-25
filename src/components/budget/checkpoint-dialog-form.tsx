"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArchiveIcon, Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Resolver, useForm } from "react-hook-form"
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { getCheckpointSchema, type CheckpointInput } from "@/lib/validations/budget"

type Dictionary = (typeof dictionaries)[Locale]

type CheckpointDialogFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
}

export function CheckpointDialogForm({ action, dictionary }: CheckpointDialogFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const form = useForm<CheckpointInput>({
    resolver: zodResolver(getCheckpointSchema(dictionary.validation)) as unknown as Resolver<CheckpointInput>,
    defaultValues: {
      name: "",
    },
  })
  const error = form.formState.errors.name

  function onSubmit(values: CheckpointInput) {
    const formData = new FormData()
    formData.set("name", values.name)

    startTransition(async () => {
      try {
        await action(formData)
        form.reset()
        setOpen(false)
        router.refresh()
        toast.success(dictionary.checkpoints.created)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.checkpoints.createError)
      }
    })
  }

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
        <form aria-busy={isPending} className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-disabled={isPending} data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="checkpoint-name">{dictionary.forms.name}</FieldLabel>
              <Input
                id="checkpoint-name"
                aria-invalid={Boolean(error)}
                disabled={isPending}
                placeholder={dictionary.checkpoints.namePlaceholder}
                {...form.register("name")}
              />
              <FieldDescription>{dictionary.checkpoints.nameHelp}</FieldDescription>
              <FieldError>{error?.message}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {isPending ? dictionary.actions.saving : dictionary.checkpoints.createAction}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
