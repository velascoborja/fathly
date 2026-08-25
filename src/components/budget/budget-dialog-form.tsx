"use client"

import { type ReactElement, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { type Resolver, type UseFormRegisterReturn, useFieldArray, useForm, useWatch } from "react-hook-form"
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { commitmentIconOptions, inferCommitmentIcon } from "@/lib/budget/commitment-icons"
import { depositIconOptions, inferDepositIcon } from "@/lib/budget/deposit-icons"
import { formatCurrency } from "@/lib/budget/format"
import { getCommitmentSchema, getDepositSchema, type CommitmentInput, type DepositInput } from "@/lib/validations/budget"
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
  categoryOptions?: string[]
  defaults?: CommitmentFormDefaults
  deleteAction?: () => Promise<void>
  mode?: "create" | "edit"
  onOpenChange?: (open: boolean) => void
  open?: boolean
  trigger?: ReactElement | null
  triggerLabel?: string
}

type CommitmentFormValues = {
  name: string
  amount?: number
  amountMode: "FIXED" | "ITEMIZED"
  parts: { name: string; amount?: number }[]
  category: string
  icon: CommitmentInput["icon"]
  frequency: "MONTHLY" | "ANNUAL"
  type: "BILL"
  notes?: string
}

type CommitmentFormDefaults = Partial<CommitmentFormValues>

type BudgetDialogFormProps = DepositDialogProps | CommitmentDialogProps

export function BudgetDialogForm(props: BudgetDialogFormProps) {
  return props.kind === "deposit" ? <DepositDialog {...props} /> : <CommitmentDialog {...props} />
}

function DepositDialog(props: DepositDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const manualIconOverrideRef = useRef(false)
  const previousAutoNameRef = useRef("")
  const mode = props.mode ?? "create"
  const title = props.triggerLabel ?? (mode === "edit" ? props.dictionary.actions.editDeposit : props.dictionary.actions.addDeposit)
  const defaultValues = useMemo(
    () => ({
      name: props.defaults?.name ?? "",
      amount: props.defaults?.amount ?? 0,
      icon: props.defaults?.icon ?? inferDepositIcon(props.defaults?.name ?? ""),
      notes: props.defaults?.notes ?? "",
    }),
    [props.defaults?.amount, props.defaults?.icon, props.defaults?.name, props.defaults?.notes]
  )
  const form = useForm<DepositInput>({
    resolver: zodResolver(getDepositSchema(props.dictionary.validation)) as unknown as Resolver<DepositInput>,
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
        toast.success(mode === "edit" ? props.dictionary.actions.depositSaved : props.dictionary.actions.depositCreated)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : props.dictionary.actions.saveError)
      }
    })
  }

  const errors = form.formState.errors
  const iconLocale: Locale = props.dictionary.forms.icon === "Icon" ? "en" : "es"
  const nameValue = useWatch({ control: form.control, name: "name" })
  const iconValue = useWatch({ control: form.control, name: "icon" })
  const trigger = props.trigger === undefined ? <Button /> : props.trigger
  const selectedIcon = depositIconOptions.find((option) => option.value === iconValue) ?? depositIconOptions[0]
  const SelectedIcon = selectedIcon.icon

  useEffect(() => {
    if (!open || manualIconOverrideRef.current || nameValue === previousAutoNameRef.current) {
      return
    }

    const nextIcon = inferDepositIcon(nameValue)
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
              <FieldLabel htmlFor={`${props.kind}-name`}>{props.dictionary.forms.name}</FieldLabel>
              <Input
                id={`${props.kind}-name`}
                aria-invalid={Boolean(errors.name)}
                placeholder={props.dictionary.formHints.depositName}
                {...form.register("name")}
              />
              <FieldDescription>{props.dictionary.formHints.depositNameHelp}</FieldDescription>
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.amount)}>
              <FieldLabel htmlFor={`${props.kind}-amount`}>{props.dictionary.forms.amount}</FieldLabel>
              <div className="relative">
                <Input
                  id={`${props.kind}-amount`}
                  aria-invalid={Boolean(errors.amount)}
                  className="pr-9"
                  inputMode="decimal"
                  placeholder={props.dictionary.formHints.amount}
                  step="0.01"
                  type="number"
                  {...form.register("amount")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground">
                  €
                </span>
              </div>
              <FieldDescription>{props.dictionary.formHints.depositAmountHelp}</FieldDescription>
              <FieldError>{errors.amount?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>{props.dictionary.forms.icon}</FieldLabel>
              <Select
                value={iconValue}
                onValueChange={(value) => {
                  manualIconOverrideRef.current = true
                  form.setValue("icon", value as DepositInput["icon"], { shouldDirty: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`-ml-1 flex size-7 shrink-0 items-center justify-center rounded-full ${selectedIcon.swatch}`}>
                      <SelectedIcon />
                    </span>
                    <span className="truncate">{selectedIcon.label[iconLocale]}</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {depositIconOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className={`flex size-7 items-center justify-center rounded-full ${option.swatch}`}>
                              <Icon />
                            </span>
                            {option.label[iconLocale]}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{props.dictionary.formHints.depositIconHelp}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${props.kind}-notes`}>{props.dictionary.forms.notes}</FieldLabel>
              <Textarea id={`${props.kind}-notes`} placeholder={props.dictionary.formHints.depositNotes} {...form.register("notes")} />
              <FieldDescription>{props.dictionary.formHints.notesHelp}</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0 border-t bg-popover px-0 pb-0 pt-4">
            {props.deleteAction && (
              <DeleteConfirmation
                action={props.deleteAction}
                dictionary={props.dictionary}
                itemName={form.getValues("name")}
                onDeleted={() => setOpen(false)}
                successMessage={props.dictionary.actions.depositDeleted}
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
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const manualIconOverrideRef = useRef(false)
  const previousAutoNameRef = useRef("")
  const mode = props.mode ?? "create"
  const title = props.triggerLabel ?? (mode === "edit" ? props.dictionary.actions.editCommitment : props.dictionary.actions.addBill)
  const categoryOptions = useMemo(
    () => normalizeCategoryOptions(props.categoryOptions, props.defaults?.category),
    [props.categoryOptions, props.defaults?.category]
  )
  const defaultValues = useMemo(
    () => ({
      name: props.defaults?.name ?? "",
      amount: props.defaults?.amount ?? 0,
      amountMode: props.defaults?.amountMode ?? "FIXED",
      parts: props.defaults?.parts ?? [],
      category: props.defaults?.category ?? categoryOptions[0] ?? "",
      icon: props.defaults?.icon ?? inferCommitmentIcon(props.defaults?.name ?? ""),
      frequency: props.defaults?.frequency ?? "MONTHLY",
      type: "BILL" as const,
      notes: props.defaults?.notes ?? "",
    }),
    [
      props.defaults?.amount,
      props.defaults?.amountMode,
      props.defaults?.category,
      props.defaults?.frequency,
      props.defaults?.icon,
      props.defaults?.name,
      props.defaults?.notes,
      props.defaults?.parts,
      categoryOptions,
    ]
  )
  const form = useForm<CommitmentFormValues>({
    resolver: zodResolver(getCommitmentSchema(props.dictionary.validation)) as unknown as Resolver<CommitmentFormValues>,
    defaultValues,
  })
  const partFields = useFieldArray({ control: form.control, name: "parts" })
  const open = props.open ?? uncontrolledOpen
  const setOpen = props.onOpenChange ?? setUncontrolledOpen

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsDeleteConfirming(false)
    }
    setOpen(nextOpen)
  }

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      previousAutoNameRef.current = defaultValues.name
      manualIconOverrideRef.current = false
    }
  }, [defaultValues, form, open])

  function onSubmit(values: CommitmentFormValues) {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (key === "parts" || (key === "amount" && values.amountMode === "ITEMIZED")) {
        return
      }
      if (value !== undefined && value !== null) {
        formData.set(key, String(value))
      }
    })
    if (values.amountMode === "ITEMIZED") {
      formData.set("parts", JSON.stringify(values.parts))
    }

    startTransition(async () => {
      try {
        await props.action(formData)
        if (mode === "create") {
          form.reset()
        }
        handleOpenChange(false)
        toast.success(mode === "edit" ? props.dictionary.actions.commitmentSaved : props.dictionary.actions.commitmentCreated)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : props.dictionary.actions.saveError)
      }
    })
  }

  const errors = form.formState.errors
  const iconLocale: Locale = props.dictionary.forms.icon === "Icon" ? "en" : "es"
  const nameValue = useWatch({ control: form.control, name: "name" })
  const categoryValue = useWatch({ control: form.control, name: "category" })
  const iconValue = useWatch({ control: form.control, name: "icon" })
  const frequencyValue = useWatch({ control: form.control, name: "frequency" })
  const amountModeValue = useWatch({ control: form.control, name: "amountMode" })
  const partsValue = useWatch({ control: form.control, name: "parts" }) ?? []
  const amountValue = useWatch({ control: form.control, name: "amount" })
  const trigger = props.trigger === undefined ? <Button /> : props.trigger
  const isAddingCategory = !categoryOptions.includes(categoryValue)
  const selectedIcon = commitmentIconOptions.find((option) => option.value === iconValue) ?? commitmentIconOptions.at(-1)!
  const SelectedIcon = selectedIcon.icon
  const frequencyLabel =
    frequencyValue === "ANNUAL" ? props.dictionary.forms.annual : props.dictionary.forms.monthly
  const partsTotalCents = partsValue.reduce(
    (sum, part) => sum + Math.round((Number(part.amount) || 0) * 100),
    0
  )

  function changeAmountMode(nextMode: "FIXED" | "ITEMIZED") {
    if (nextMode === amountModeValue) {
      return
    }

    if (nextMode === "ITEMIZED") {
      const currentAmount = Number(form.getValues("amount")) || 0
      form.setValue("amountMode", "ITEMIZED", { shouldDirty: true })
      form.setValue("parts", [
        { name: props.dictionary.forms.currentAmountPart, amount: currentAmount },
        { name: "", amount: undefined },
      ], { shouldDirty: true })
      return
    }

    if (!window.confirm(props.dictionary.actions.itemizedToFixedConfirmation)) {
      return
    }

    form.setValue("amount", partsTotalCents / 100, { shouldDirty: true })
    form.setValue("parts", [], { shouldDirty: true })
    form.setValue("amountMode", "FIXED", { shouldDirty: true })
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger render={trigger}>
          <PlusIcon data-icon="inline-start" />
          {title}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{props.dictionary.dashboard.subtitle}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="commitment-name">{props.dictionary.forms.name}</FieldLabel>
              <Input
                id="commitment-name"
                aria-invalid={Boolean(errors.name)}
                placeholder={props.dictionary.formHints.commitmentName}
                {...form.register("name")}
              />
              <FieldDescription>{props.dictionary.formHints.commitmentNameHelp}</FieldDescription>
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>{props.dictionary.forms.amountCalculation}</FieldLabel>
              <Select value={amountModeValue} onValueChange={(value) => changeAmountMode(value as "FIXED" | "ITEMIZED")}>
                <SelectTrigger className="w-full">
                  <span>{amountModeValue === "ITEMIZED" ? props.dictionary.forms.itemizedAmount : props.dictionary.forms.fixedAmount}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="FIXED">{props.dictionary.forms.fixedAmount}</SelectItem>
                    <SelectItem value="ITEMIZED">{props.dictionary.forms.itemizedAmount}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{props.dictionary.formHints.amountCalculationHelp}</FieldDescription>
            </Field>
            {amountModeValue === "FIXED" ? (
              <Field data-invalid={Boolean(errors.amount)}>
                <FieldLabel htmlFor="commitment-amount">{props.dictionary.forms.amount}</FieldLabel>
                <MoneyInput
                  id="commitment-amount"
                  invalid={Boolean(errors.amount)}
                  placeholder={props.dictionary.formHints.amount}
                  registration={form.register("amount")}
                />
                <FieldDescription>{props.dictionary.formHints.commitmentAmountHelp}</FieldDescription>
                <FieldError>{errors.amount?.message}</FieldError>
                <AmountSummary
                  dictionary={props.dictionary}
                  frequency={frequencyValue}
                  locale={iconLocale}
                  totalCents={Math.round((Number(amountValue) || 0) * 100)}
                />
              </Field>
            ) : (
              <Field data-invalid={Boolean(errors.parts)}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>{props.dictionary.forms.commitmentParts}</FieldLabel>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
                    {partFields.fields.length}/20
                  </span>
                </div>
                <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
                  {partFields.fields.map((part, index) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_minmax(6.5rem,0.55fr)_2.75rem] items-start gap-2 p-2.5 sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem] sm:p-3"
                      key={part.id}
                    >
                      <div className="min-w-0">
                        <Input
                          aria-label={`${props.dictionary.forms.partName} ${index + 1}`}
                          aria-invalid={Boolean(errors.parts?.[index]?.name)}
                          className="h-11 rounded-xl sm:h-10"
                          placeholder={props.dictionary.formHints.commitmentPartName}
                          {...form.register(`parts.${index}.name`)}
                        />
                        <FieldError>{errors.parts?.[index]?.name?.message}</FieldError>
                      </div>
                      <div className="min-w-0">
                        <MoneyInput
                          id={`commitment-part-${index}-amount`}
                          inputClassName="h-11 rounded-xl sm:h-10"
                          invalid={Boolean(errors.parts?.[index]?.amount)}
                          label={`${props.dictionary.forms.amount} ${index + 1}`}
                          placeholder={props.dictionary.formHints.amount}
                          registration={form.register(`parts.${index}.amount`)}
                        />
                        <FieldError>{errors.parts?.[index]?.amount?.message}</FieldError>
                      </div>
                      <Button
                        aria-label={`${props.dictionary.actions.removeCommitmentPart} ${index + 1}`}
                        className="size-11 self-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-10"
                        onClick={() => partFields.remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-fit"
                  disabled={partFields.fields.length >= 20}
                  onClick={() => partFields.append({ name: "", amount: undefined })}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon data-icon="inline-start" />
                  {props.dictionary.actions.addCommitmentPart}
                </Button>
                <FieldDescription>{props.dictionary.formHints.commitmentPartsHelp}</FieldDescription>
                <FieldError>{typeof errors.parts?.message === "string" ? errors.parts.message : undefined}</FieldError>
                <AmountSummary dictionary={props.dictionary} frequency={frequencyValue} locale={iconLocale} totalCents={partsTotalCents} />
              </Field>
            )}
            <Field data-invalid={Boolean(errors.category)}>
              <FieldLabel>{props.dictionary.forms.category}</FieldLabel>
              <Select
                value={isAddingCategory ? newCategorySelectValue : categoryValue}
                onValueChange={(value) => {
                  if (!value) {
                    return
                  }

                  if (value === newCategorySelectValue) {
                    form.setValue("category", "", { shouldDirty: true })
                    return
                  }

                  form.setValue("category", value, { shouldDirty: true })
                }}
              >
                <SelectTrigger aria-invalid={Boolean(errors.category)} className="w-full">
                  <span className="truncate">
                    {isAddingCategory ? props.dictionary.forms.newCategory : categoryValue || props.dictionary.formHints.category}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value={newCategorySelectValue}>{props.dictionary.forms.newCategory}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {isAddingCategory && (
                <Input
                  id="commitment-category"
                  aria-invalid={Boolean(errors.category)}
                  placeholder={props.dictionary.formHints.newCategory}
                  {...form.register("category")}
                />
              )}
              <FieldDescription>{props.dictionary.formHints.categoryHelp}</FieldDescription>
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
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`-ml-1 flex size-7 shrink-0 items-center justify-center rounded-full ${selectedIcon.swatch}`}>
                      <SelectedIcon />
                    </span>
                    <span className="truncate">{selectedIcon.label[iconLocale]}</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {commitmentIconOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className={`flex size-7 items-center justify-center rounded-full ${option.swatch}`}>
                              <Icon />
                            </span>
                            {option.label[iconLocale]}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{props.dictionary.formHints.iconHelp}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{props.dictionary.forms.frequency}</FieldLabel>
              <Select
                value={frequencyValue}
                onValueChange={(value) =>
                  form.setValue("frequency", value as CommitmentInput["frequency"], { shouldDirty: true })
                }
              >
                <SelectTrigger className="w-full">
                  <span>{frequencyLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="MONTHLY">{props.dictionary.forms.monthly}</SelectItem>
                    <SelectItem value="ANNUAL">{props.dictionary.forms.annual}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{props.dictionary.formHints.frequencyHelp}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="commitment-notes">{props.dictionary.forms.notes}</FieldLabel>
              <Textarea id="commitment-notes" placeholder={props.dictionary.formHints.commitmentNotes} {...form.register("notes")} />
              <FieldDescription>{props.dictionary.formHints.notesHelp}</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="sticky bottom-[-1.25rem] -mx-5 -mb-5 grid grid-cols-2 gap-2 border-t bg-popover/95 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-popover/85 sm:flex sm:pb-5">
            {props.deleteAction && (
              <DeleteConfirmation
                action={props.deleteAction}
                buttonClassName="h-11 w-full sm:h-9 sm:w-auto"
                confirmationClassName="col-span-2 w-full sm:w-auto"
                dictionary={props.dictionary}
                itemName={form.getValues("name")}
                onConfirmingChange={setIsDeleteConfirming}
                onDeleted={() => handleOpenChange(false)}
                successMessage={props.dictionary.actions.commitmentDeleted}
              />
            )}
            <Button
              className={`${props.deleteAction ? "" : "col-span-2"} h-11 w-full sm:ml-auto sm:h-9 sm:w-auto ${isDeleteConfirming ? "max-sm:hidden" : ""}`}
              disabled={isPending}
              type="submit"
            >
              {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {props.dictionary.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const newCategorySelectValue = "__new_category__"

function MoneyInput({
  id,
  inputClassName,
  invalid,
  label,
  placeholder,
  registration,
}: {
  id: string
  inputClassName?: string
  invalid: boolean
  label?: string
  placeholder: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        aria-label={label}
        aria-invalid={invalid}
        className={`pr-9 ${inputClassName ?? ""}`}
        inputMode="decimal"
        placeholder={placeholder}
        step="0.01"
        type="number"
        {...registration}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground">
        €
      </span>
    </div>
  )
}

function SummaryAmount({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <strong className="font-mono text-lg text-primary">{value}</strong>
    </span>
  )
}

function AmountSummary({
  dictionary,
  frequency,
  locale,
  totalCents,
}: {
  dictionary: Dictionary
  frequency: "MONTHLY" | "ANNUAL"
  locale: Locale
  totalCents: number
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4" aria-live="polite">
      {frequency === "ANNUAL" ? (
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2">
          <SummaryAmount label={dictionary.forms.annualTotal} value={formatCurrency(totalCents, locale)} />
          <SummaryAmount label={dictionary.forms.monthlyEquivalent} value={formatCurrency(Math.round(totalCents / 12), locale)} />
        </div>
      ) : (
        <SummaryAmount label={dictionary.forms.monthlyTotal} value={formatCurrency(totalCents, locale)} />
      )}
    </div>
  )
}

function normalizeCategoryOptions(categoryOptions: string[] | undefined, currentCategory: string | undefined) {
  return Array.from(new Set([...(categoryOptions ?? []), currentCategory].filter(Boolean).map((category) => category!.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  )
}

function DeleteConfirmation({
  action,
  buttonClassName,
  confirmationClassName,
  dictionary,
  itemName,
  onConfirmingChange,
  onDeleted,
  successMessage,
}: {
  action: () => Promise<void>
  buttonClassName?: string
  confirmationClassName?: string
  dictionary: Dictionary
  itemName: string
  onConfirmingChange?: (confirming: boolean) => void
  onDeleted: () => void
  successMessage: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updateConfirming(nextConfirming: boolean) {
    setConfirming(nextConfirming)
    onConfirmingChange?.(nextConfirming)
  }

  if (!confirming) {
    return (
      <Button className={buttonClassName} onClick={() => updateConfirming(true)} type="button" variant="destructive">
        <Trash2Icon data-icon="inline-start" />
        {dictionary.actions.delete}
      </Button>
    )
  }

  return (
    <div className={`flex flex-col gap-2 sm:mr-auto ${confirmationClassName ?? ""}`}>
      <p className="max-w-72 text-sm text-muted-foreground">{dictionary.actions.deleteConfirmation.replace("{name}", itemName)}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={() => updateConfirming(false)} size="sm" type="button" variant="outline">
          {dictionary.actions.cancel}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await action()
                toast.success(successMessage)
                onDeleted()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : dictionary.actions.deleteError)
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
