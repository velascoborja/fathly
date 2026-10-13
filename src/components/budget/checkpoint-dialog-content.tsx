"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { getCheckpointSchema, type CheckpointInput } from "@/lib/validations/budget"

type Dictionary = (typeof dictionaries)[Locale]

export type CheckpointDialogFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
}

export function CheckpointDialogContent({ action, dictionary, onOpenChange }: CheckpointDialogFormProps & { onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
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
        onOpenChange(false)
        router.refresh()
        toast.success(dictionary.checkpoints.created)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.checkpoints.createError)
      }
    })
  }

  return (
    <form aria-busy={isPending} className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-disabled={isPending} data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="checkpoint-name">{dictionary.forms.name}</FieldLabel>
          <Input
            autoFocus
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
  )
}
