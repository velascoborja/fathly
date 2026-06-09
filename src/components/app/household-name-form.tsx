"use client"

import { useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { type Resolver, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { householdNameFormSchema, type HouseholdNameFormInput } from "@/lib/validations/household"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type HouseholdNameFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
  householdName: string
}

export function HouseholdNameForm({ action, dictionary, householdName }: HouseholdNameFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const form = useForm<HouseholdNameFormInput>({
    resolver: zodResolver(householdNameFormSchema) as unknown as Resolver<HouseholdNameFormInput>,
    defaultValues: { name: householdName },
  })

  useEffect(() => {
    form.reset({ name: householdName })
  }, [form, householdName])

  function onSubmit(values: HouseholdNameFormInput) {
    const formData = new FormData()
    formData.set("name", values.name)

    startTransition(async () => {
      try {
        await action(formData)
        form.reset({ name: values.name })
        router.refresh()
        toast.success(dictionary.settings.householdNameSaved)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.settings.householdNameError)
      }
    })
  }

  const error = form.formState.errors.name

  return (
    <form aria-busy={isPending} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-disabled={isPending} data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="household-name">{dictionary.settings.householdName}</FieldLabel>
          <Input
            id="household-name"
            aria-invalid={Boolean(error)}
            disabled={isPending}
            maxLength={80}
            {...form.register("name")}
          />
          <FieldError>{error?.message}</FieldError>
        </Field>
      </FieldGroup>
      <Button className="self-start" disabled={isPending || !form.formState.isDirty} type="submit">
        {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
        {isPending ? dictionary.actions.saving : dictionary.actions.save}
      </Button>
    </form>
  )
}
