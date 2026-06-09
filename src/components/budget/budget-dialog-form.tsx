"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { commitmentSchema, depositSchema, type CommitmentInput, type DepositInput } from "@/lib/validations/budget"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type DepositDialogProps = {
  kind: "deposit"
  dictionary: Dictionary
  action: (formData: FormData) => Promise<void>
  triggerLabel?: string
}

type CommitmentDialogProps = {
  kind: "commitment"
  dictionary: Dictionary
  action: (formData: FormData) => Promise<void>
  defaults?: Partial<CommitmentInput>
  triggerLabel?: string
}

type BudgetDialogFormProps = DepositDialogProps | CommitmentDialogProps

export function BudgetDialogForm(props: BudgetDialogFormProps) {
  return props.kind === "deposit" ? <DepositDialog {...props} /> : <CommitmentDialog {...props} />
}

function DepositDialog(props: DepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const form = useForm<DepositInput>({
    resolver: zodResolver(depositSchema) as unknown as Resolver<DepositInput>,
    defaultValues: { name: "", amount: 0, notes: "" },
  })

  const title = props.triggerLabel ?? props.dictionary.actions.addDeposit

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
        form.reset()
        setOpen(false)
        toast.success(title)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save.")
      }
    })
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        {title}
      </DialogTrigger>
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
          <Button className="self-end" disabled={isPending} type="submit">
            {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            {props.dictionary.actions.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CommitmentDialog(props: CommitmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const form = useForm<CommitmentInput>({
    resolver: zodResolver(commitmentSchema) as unknown as Resolver<CommitmentInput>,
    defaultValues: {
      name: "",
      amount: 0,
      category: props.defaults?.category ?? "Casa",
      frequency: props.defaults?.frequency ?? "MONTHLY",
      type: props.defaults?.type ?? "BILL",
      notes: "",
    },
  })
  const title = props.triggerLabel ?? props.dictionary.actions.addBill

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
        form.reset()
        setOpen(false)
        toast.success(title)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save.")
      }
    })
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        {title}
      </DialogTrigger>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{props.dictionary.forms.frequency}</FieldLabel>
                <Select
                  defaultValue={form.getValues("frequency")}
                  onValueChange={(value) => form.setValue("frequency", value as CommitmentInput["frequency"])}
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
                  defaultValue={form.getValues("type")}
                  onValueChange={(value) => form.setValue("type", value as CommitmentInput["type"])}
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
          <Button className="self-end" disabled={isPending} type="submit">
            {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
            {props.dictionary.actions.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
