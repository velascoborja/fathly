"use client"

import { useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { planSettingsSchema, type PlanSettingsInput } from "@/lib/validations/budget"

type Dictionary = (typeof dictionaries)[Locale]

type PlanSettingsFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
  lowMonthlyMarginBasisPoints: number
}

export function PlanSettingsForm({
  action,
  dictionary,
  lowMonthlyMarginBasisPoints,
}: PlanSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const lowMonthlyMarginPercent = lowMonthlyMarginBasisPoints / 100
  const form = useForm<PlanSettingsInput>({
    resolver: zodResolver(planSettingsSchema) as unknown as Resolver<PlanSettingsInput>,
    defaultValues: { lowMonthlyMarginPercent },
  })

  useEffect(() => {
    form.reset({ lowMonthlyMarginPercent })
  }, [form, lowMonthlyMarginPercent])

  function onSubmit(values: PlanSettingsInput) {
    const formData = new FormData()
    formData.set("lowMonthlyMarginPercent", String(values.lowMonthlyMarginPercent))

    startTransition(async () => {
      try {
        await action(formData)
        form.reset({ lowMonthlyMarginPercent: values.lowMonthlyMarginPercent })
        router.refresh()
        toast.success(dictionary.settings.planSettingsSaved)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.settings.planSettingsError)
      }
    })
  }

  const error = form.formState.errors.lowMonthlyMarginPercent

  return (
    <form aria-busy={isPending} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-disabled={isPending} data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="low-monthly-margin-percent">{dictionary.settings.lowMonthlyMarginPercent}</FieldLabel>
          <div className="flex max-w-40 items-center gap-2">
            <Input
              id="low-monthly-margin-percent"
              aria-invalid={Boolean(error)}
              disabled={isPending}
              inputMode="decimal"
              max={100}
              min={0}
              step="0.1"
              type="number"
              {...form.register("lowMonthlyMarginPercent")}
            />
            <span className="text-sm font-bold text-muted-foreground">%</span>
          </div>
          <FieldDescription>{dictionary.settings.lowMonthlyMarginDescription}</FieldDescription>
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
