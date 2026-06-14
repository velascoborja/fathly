"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"

type Dictionary = (typeof dictionaries)[Locale]

type SetupItemKind = "deposit" | "monthlyBill" | "annualCost" | "saving"

type SetupItem = {
  id: number
}

type SetupSection = {
  addLabel: string
  amountPlaceholder: string
  description: string
  kind: SetupItemKind
  namePlaceholder: string
  optional?: boolean
  title: string
}

type InitialSetupFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
}

export function InitialSetupForm({ action, dictionary }: InitialSetupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deposits, setDeposits] = useState<SetupItem[]>(() => [createSetupItem()])
  const [monthlyBills, setMonthlyBills] = useState<SetupItem[]>(() => [createSetupItem()])
  const [annualCosts, setAnnualCosts] = useState<SetupItem[]>(() => [createSetupItem()])
  const [savings, setSavings] = useState<SetupItem[]>(() => [createSetupItem()])

  const sections: SetupSection[] = [
    {
      addLabel: dictionary.setup.addIncome,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.depositAmountHelp,
      kind: "deposit",
      namePlaceholder: dictionary.setup.examples.incomeName,
      title: dictionary.setup.incomeTitle,
    },
    {
      addLabel: dictionary.setup.addExpense,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.commitmentAmountHelp,
      kind: "monthlyBill",
      namePlaceholder: dictionary.setup.examples.monthlyBillName,
      title: dictionary.setup.monthlyBillsTitle,
    },
    {
      addLabel: dictionary.setup.addExpense,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.frequencyHelp,
      kind: "annualCost",
      namePlaceholder: dictionary.setup.examples.annualCostName,
      optional: true,
      title: dictionary.setup.annualCostsTitle,
    },
    {
      addLabel: dictionary.setup.addExpense,
      amountPlaceholder: dictionary.formHints.amount,
      description: dictionary.formHints.typeHelp,
      kind: "saving",
      namePlaceholder: dictionary.setup.examples.savingsName,
      optional: true,
      title: dictionary.setup.savingsTitle,
    },
  ]

  function getItems(kind: SetupItemKind) {
    switch (kind) {
      case "deposit":
        return deposits
      case "monthlyBill":
        return monthlyBills
      case "annualCost":
        return annualCosts
      case "saving":
        return savings
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
      case "annualCost":
        setAnnualCosts(updater)
        break
      case "saving":
        setSavings(updater)
        break
    }
  }

  function onSubmit(formData: FormData) {
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
        {sections.map((section) => (
          <Card key={section.kind} className="fathly-card">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                {section.optional ? (
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    {dictionary.setup.optional}
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {getItems(section.kind).map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-[20px] border border-border bg-muted/45 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.45fr)_auto]">
                    <Field>
                      <FieldLabel htmlFor={`${section.kind}-name-${item.id}`}>
                        {dictionary.forms.name}
                      </FieldLabel>
                      <Input
                        id={`${section.kind}-name-${item.id}`}
                        name={`${section.kind}Name`}
                        placeholder={section.namePlaceholder}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`${section.kind}-amount-${item.id}`}>
                        {dictionary.forms.amount}
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id={`${section.kind}-amount-${item.id}`}
                          className="pr-9"
                          inputMode="decimal"
                          name={`${section.kind}Amount`}
                          placeholder={section.amountPlaceholder}
                          step="0.01"
                          type="number"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-muted-foreground">
                          €
                        </span>
                      </div>
                    </Field>
                    <Button
                      aria-label={dictionary.setup.removeItem}
                      className="self-end"
                      disabled={getItems(section.kind).length === 1 || isPending}
                      onClick={() => setItems(section.kind, (items) => items.filter((row) => row.id !== item.id))}
                      size="icon-lg"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                <Button
                  className="w-fit"
                  disabled={isPending}
                  onClick={() => setItems(section.kind, (items) => [...items, createSetupItem()])}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon data-icon="inline-start" />
                  {section.addLabel}
                </Button>
              </FieldGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="fathly-card border-primary/35 bg-muted/70">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <FieldDescription className="text-sm font-medium">{dictionary.setup.requiredHint}</FieldDescription>
          <Button className="sm:min-w-48" disabled={isPending} type="submit">
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
    id: nextSetupItemId,
  }
}
