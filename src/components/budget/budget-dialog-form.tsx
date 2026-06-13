"use client"

import { type ReactElement, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { type Resolver, useForm, useWatch } from "react-hook-form"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { commitmentIconOptions, inferCommitmentIcon } from "@/lib/budget/commitment-icons"
import { commitmentSchema, depositSchema, type CommitmentInput, type DepositInput } from "@/lib/validations/budget"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type DepositDialogProps = {
  kind: "deposit"
  dictionary: Dictionary
  action: (formData: FormData) => Promise<void>
  defaults?: Partial<DepositInput>
  deleteAction?: () => Promise<void>
  mode?: "create" | "edit"
  onOpenChange?: (open: boolean) => void
  open?: boolean
  trigger?: ReactElement | null
  triggerLabel?: string
}

type CommitmentDialogProps = {
  kind: "commitment"
  dictionary: Dictionary
  action: (formData: FormData) => Promise<void>
  defaults?: Partial<CommitmentInput>
  deleteAction?: () => Promise<void>
  mode?: "create" | "edit"
  onOpenChange?: (open: boolean) => void
  open?: boolean
  trigger?: ReactElement | null
  triggerLabel?: string
}

type BudgetDialogFormProps = DepositDialogProps | CommitmentDialogProps

export function BudgetDialogForm(props: BudgetDialogFormProps) {
  return props.kind === "deposit" ? <DepositDialog {...props} /> : <CommitmentDialog {...props} />
}

function DepositDialog(props: DepositDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const mode = props.mode ?? "create"
  const title = props.triggerLabel ?? (mode === "edit" ? props.dictionary.actions.editDeposit : props.dictionary.actions.addDeposit)
  const defaultValues = useMemo(
    () => ({
      name: props.defaults?.name ?? "",
      amount: props.defaults?.amount ?? 0,
      notes: props.defaults?.notes ?? "",
    }),
    [props.defaults?.amount, props.defaults?.name, props.defaults?.notes]
  )
  const form = useForm<DepositInput>({
    resolver: zodResolver(depositSchema) as unknown as Resolver<DepositInput>,
    defaultValues,
  })
  const open = props.open ?? uncontrolledOpen
  const setOpen = props.onOpenChange ?? setUncontrolledOpen

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, open])

  function onSubmit(values: DepositInput) {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value))
      }
    })

    startTransition(async () => {
      try {
        await props.action(formData)
        if (mode === "create") {
          form.reset()
        }
        setOpen(false)
        toast.success(mode === "edit" ? props.dictionary.actions.saved : title)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save.")
      }
    })
  }

  const errors = form.formState.errors
  const trigger = props.trigger === undefined ? <Button /> : props.trigger

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger render={trigger}>
          <PlusIcon data-icon="inline-start" />
          {title}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{props.dictionary.dashboard.subtitle}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor={`${props.kind}-name`}>{props.dictionary.forms.name}</FieldLabel>
              <Input id={`${props.kind}-name`} aria-invalid={Boolean(errors.name)} {...form.register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor={`${props.kind}-amount`}>{props.dictionary.forms.amount}</FieldLabel>
              <Input
                id={`${props.kind}-amount`}
                aria-invalid={Boolean(errors.amount)}
                inputMode="decimal"
                step="0.01"
                type="number"
                {...form.register("amount")}
              />
              <FieldError>{errors.amount?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${props.kind}-notes`}>{props.dictionary.forms.notes}</FieldLabel>
              <Textarea id={`${props.kind}-notes`} {...form.register("notes")} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0">
            {props.deleteAction && (
              <DeleteConfirmation
                action={props.deleteAction}
                dictionary={props.dictionary}
                itemName={form.getValues("name")}
                onDeleted={() => setOpen(false)}
              />
            )}
            <Button className="sm:ml-auto" disabled={isPending} type="submit">
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {props.dictionary.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CommitmentDialog(props: CommitmentDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const manualIconOverrideRef = useRef(false)
  const previousAutoNameRef = useRef("")
  const mode = props.mode ?? "create"
  const title = props.triggerLabel ?? (mode === "edit" ? props.dictionary.actions.editCommitment : props.dictionary.actions.addBill)
  const defaultValues = useMemo(
    () => ({
      name: props.defaults?.name ?? "",
      amount: props.defaults?.amount ?? 0,
      category: props.defaults?.category ?? "Casa",
      icon: props.defaults?.icon ?? inferCommitmentIcon(props.defaults?.name ?? ""),
      frequency: props.defaults?.frequency ?? "MONTHLY",
      type: props.defaults?.type ?? "BILL",
      notes: props.defaults?.notes ?? "",
    }),
    [
      props.defaults?.amount,
      props.defaults?.category,
      props.defaults?.frequency,
      props.defaults?.icon,
      props.defaults?.name,
      props.defaults?.notes,
      props.defaults?.type,
    ]
  )
  const form = useForm<CommitmentInput>({
    resolver: zodResolver(commitmentSchema) as unknown as Resolver<CommitmentInput>,
    defaultValues,
  })
  const open = props.open ?? uncontrolledOpen
  const setOpen = props.onOpenChange ?? setUncontrolledOpen

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      previousAutoNameRef.current = defaultValues.name
      manualIconOverrideRef.current = false
    }
  }, [defaultValues, form, open])

  function onSubmit(values: CommitmentInput) {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value))
      }
    })

    startTransition(async () => {
      try {
        await props.action(formData)
        if (mode === "create") {
          form.reset()
        }
        setOpen(false)
        toast.success(mode === "edit" ? props.dictionary.actions.saved : title)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save.")
      }
    })
  }

  const errors = form.formState.errors
  const iconLocale: Locale = props.dictionary.forms.icon === "Icon" ? "en" : "es"
  const nameValue = useWatch({ control: form.control, name: "name" })
  const iconValue = useWatch({ control: form.control, name: "icon" })
  const frequencyValue = useWatch({ control: form.control, name: "frequency" })
  const typeValue = useWatch({ control: form.control, name: "type" })
  const trigger = props.trigger === undefined ? <Button /> : props.trigger

  useEffect(() => {
    if (!open || manualIconOverrideRef.current || nameValue === previousAutoNameRef.current) {
      return
    }

    const nextIcon = inferCommitmentIcon(nameValue)
    previousAutoNameRef.current = nameValue

    if (nextIcon !== iconValue) {
      form.setValue("icon", nextIcon, { shouldDirty: true })
    }
  }, [form, iconValue, nameValue, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger render={trigger}>
          <PlusIcon data-icon="inline-start" />
          {title}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{props.dictionary.dashboard.subtitle}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="commitment-name">{props.dictionary.forms.name}</FieldLabel>
              <Input id="commitment-name" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor="commitment-amount">{props.dictionary.forms.amount}</FieldLabel>
              <Input
                id="commitment-amount"
                aria-invalid={Boolean(errors.amount)}
                inputMode="decimal"
                step="0.01"
                type="number"
                {...form.register("amount")}
              />
              <FieldError>{errors.amount?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.category)}>
              <FieldLabel htmlFor="commitment-category">{props.dictionary.forms.category}</FieldLabel>
              <Input id="commitment-category" aria-invalid={Boolean(errors.category)} {...form.register("category")} />
              <FieldError>{errors.category?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>{props.dictionary.forms.icon}</FieldLabel>
              <Select
                value={iconValue}
                onValueChange={(value) => {
                  manualIconOverrideRef.current = true
                  form.setValue("icon", value as CommitmentInput["icon"], { shouldDirty: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {commitmentIconOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className={`flex size-7 items-center justify-center rounded-full ${option.swatch}`}>
                              <Icon className="size-3.5" />
                            </span>
                            {option.label[iconLocale]}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{props.dictionary.forms.frequency}</FieldLabel>
                <Select
                  value={frequencyValue}
                  onValueChange={(value) =>
                    form.setValue("frequency", value as CommitmentInput["frequency"], { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="MONTHLY">{props.dictionary.forms.monthly}</SelectItem>
                      <SelectItem value="ANNUAL">{props.dictionary.forms.annual}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{props.dictionary.forms.type}</FieldLabel>
                <Select
                  value={typeValue}
                  onValueChange={(value) => form.setValue("type", value as CommitmentInput["type"], { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="BILL">{props.dictionary.forms.bill}</SelectItem>
                      <SelectItem value="SAVINGS">{props.dictionary.forms.savings}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="commitment-notes">{props.dictionary.forms.notes}</FieldLabel>
              <Textarea id="commitment-notes" {...form.register("notes")} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0">
            {props.deleteAction && (
              <DeleteConfirmation
                action={props.deleteAction}
                dictionary={props.dictionary}
                itemName={form.getValues("name")}
                onDeleted={() => setOpen(false)}
              />
            )}
            <Button className="sm:ml-auto" disabled={isPending} type="submit">
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {props.dictionary.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmation({
  action,
  dictionary,
  itemName,
  onDeleted,
}: {
  action: () => Promise<void>
  dictionary: Dictionary
  itemName: string
  onDeleted: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button onClick={() => setConfirming(true)} type="button" variant="destructive">
        <Trash2Icon data-icon="inline-start" />
        {dictionary.actions.delete}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:mr-auto">
      <p className="max-w-72 text-sm text-muted-foreground">{dictionary.actions.deleteConfirmation.replace("{name}", itemName)}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={() => setConfirming(false)} size="sm" type="button" variant="outline">
          {dictionary.actions.cancel}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await action()
                toast.success(dictionary.actions.deleted)
                onDeleted()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not delete.")
              }
            })
          }}
          size="sm"
          type="button"
          variant="destructive"
        >
          {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {dictionary.actions.confirmDelete}
        </Button>
      </div>
    </div>
  )
}
