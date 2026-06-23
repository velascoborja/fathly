"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CircleDollarSignIcon,
  Loader2Icon,
  PlusIcon,
  ReceiptTextIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type SetupItemKind = "deposit" | "monthlyBill"

type SetupItem = {
  amount: string
  id: number
  name: string
}

type SetupSection = {
  addLabel: string
  amountLabel: string
  amountPlaceholder: string
  description: string
  icon: LucideIcon
  kind: SetupItemKind
  nameLabel: string
  namePlaceholder: string
  tone: "income" | "expense"
  title: string
}

type InitialSetupFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
}

const MAX_SETUP_ITEMS = 2

export function InitialSetupForm({ action, dictionary }: InitialSetupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deposits, setDeposits] = useState<SetupItem[]>(() => [createSetupItem()])
  const [monthlyBills, setMonthlyBills] = useState<SetupItem[]>(() => [createSetupItem()])

  const sections: SetupSection[] = [
    {
      addLabel: dictionary.setup.addIncome,
      amountLabel: dictionary.setup.incomeAmountLabel,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.depositAmountHelp,
      icon: CircleDollarSignIcon,
      kind: "deposit",
      nameLabel: dictionary.setup.incomeNameLabel,
      namePlaceholder: dictionary.setup.examples.incomeName,
      tone: "income",
      title: dictionary.setup.incomeTitle,
    },
    {
      addLabel: dictionary.setup.addExpense,
      amountLabel: dictionary.setup.expenseAmountLabel,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.commitmentAmountHelp,
      icon: ReceiptTextIcon,
      kind: "monthlyBill",
      nameLabel: dictionary.setup.expenseNameLabel,
      namePlaceholder: dictionary.setup.examples.monthlyBillName,
      tone: "expense",
      title: dictionary.setup.monthlyBillsTitle,
    },
  ]

  function getItems(kind: SetupItemKind) {
    switch (kind) {
      case "deposit":
        return deposits
      case "monthlyBill":
        return monthlyBills
    }
  }

  function setItems(kind: SetupItemKind, updater: (items: SetupItem[]) => SetupItem[]) {
    switch (kind) {
      case "deposit":
        setDeposits(updater)
        break
      case "monthlyBill":
        setMonthlyBills(updater)
        break
    }
  }

  function updateItem(kind: SetupItemKind, id: number, field: "amount" | "name", value: string) {
    setItems(kind, (items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const hasIncome = deposits.some(isCompleteSetupItem)
  const hasExpense = monthlyBills.some(isCompleteSetupItem)
  const canFinish = hasIncome && hasExpense && !isPending

  function onSubmit(formData: FormData) {
    if (!hasIncome || !hasExpense) {
      toast.error(dictionary.setup.requiredHint)
      return
    }

    startTransition(async () => {
      try {
        await action(formData)
        router.push("/dashboard")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.setup.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => {
          const items = getItems(section.kind)
          const canAddItem = items.length < MAX_SETUP_ITEMS && !isPending
          const Icon = section.icon
          const toneClasses =
            section.tone === "income"
              ? {
                  card: "border-success/25 hover:border-success/45",
                  count: "border-success/20 bg-success/10 text-success",
                  icon: "bg-success/10 text-success",
                  row: "border-success/15 bg-success/5",
                }
              : {
                  card: "border-coral/30 hover:border-coral/55",
                  count: "border-coral/25 bg-coral/10 text-coral-dark",
                  icon: "bg-coral/10 text-coral-dark",
                  row: "border-coral/20 bg-[#fff4f0]",
                }

          return (
            <Card key={section.kind} className={`fathly-card ${toneClasses.card}`}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${toneClasses.icon}`}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClasses.count}`}>
                      {items.length}/{MAX_SETUP_ITEMS}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`grid gap-3 rounded-[20px] border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.45fr)_auto] ${toneClasses.row}`}
                    >
                      <Field>
                        <FieldLabel htmlFor={`${section.kind}-name-${item.id}`}>
                          {section.nameLabel}
                        </FieldLabel>
                        <Input
                          id={`${section.kind}-name-${item.id}`}
                          name={`${section.kind}Name`}
                          onChange={(event) => updateItem(section.kind, item.id, "name", event.target.value)}
                          placeholder={section.namePlaceholder}
                          value={item.name}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`${section.kind}-amount-${item.id}`}>
                          {section.amountLabel}
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            id={`${section.kind}-amount-${item.id}`}
                            className="pr-9"
                            inputMode="decimal"
                            name={`${section.kind}Amount`}
                            onChange={(event) => updateItem(section.kind, item.id, "amount", event.target.value)}
                            placeholder={section.amountPlaceholder}
                            step="0.01"
                            type="number"
                            value={item.amount}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground">
                            €
                          </span>
                        </div>
                      </Field>
                      <Button
                        aria-label={dictionary.setup.removeItem}
                        className="self-end"
                        disabled={items.length === 1 || isPending}
                        onClick={() => setItems(section.kind, (currentItems) => currentItems.filter((row) => row.id !== item.id))}
                        size="icon-lg"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      className="w-fit"
                      disabled={!canAddItem}
                      onClick={() =>
                        setItems(section.kind, (currentItems) =>
                          currentItems.length >= MAX_SETUP_ITEMS ? currentItems : [...currentItems, createSetupItem()]
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      <PlusIcon data-icon="inline-start" />
                      {section.addLabel}
                    </Button>
                    <FieldDescription className="text-xs font-medium">
                      {dictionary.setup.limitHint}
                    </FieldDescription>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="fathly-card border-primary/35 bg-muted/70">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <FieldDescription className="text-sm font-medium">{dictionary.setup.requiredHint}</FieldDescription>
          <Button className="sm:min-w-48" disabled={!canFinish} type="submit">
            {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}
            {isPending ? dictionary.setup.finishing : dictionary.setup.finish}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

let nextSetupItemId = 0

function createSetupItem() {
  nextSetupItemId += 1
  return {
    amount: "",
    id: nextSetupItemId,
    name: "",
  }
}

function isCompleteSetupItem(item: SetupItem) {
  const amount = Number(item.amount)

  return item.name.trim().length > 0 && Number.isFinite(amount) && amount > 0
}
