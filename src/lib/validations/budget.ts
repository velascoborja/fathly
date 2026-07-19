import { z } from "zod"

import { commitmentIconValues } from "@/lib/budget/commitment-icons"
import { depositIconValues } from "@/lib/budget/deposit-icons"
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries"

type ValidationMessages = (typeof dictionaries)[Locale]["validation"]

const defaultValidationMessages = dictionaries.es.validation

export function getMoneyAmountSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.coerce
    .number({ message: messages.amountInvalid })
    .positive(messages.amountPositive)
    .max(1_000_000, messages.amountTooLarge)
}

export function getDepositSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(80),
    amount: getMoneyAmountSchema(messages),
    icon: z.enum(depositIconValues).default("income"),
    notes: z.string().trim().max(240).optional(),
  })
}

export function getCommitmentSchema(messages: ValidationMessages = defaultValidationMessages) {
  const common = z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(80),
    category: getCategoryNameSchema(messages),
    icon: z.enum(commitmentIconValues).default("receipt"),
    frequency: z.enum(["MONTHLY", "ANNUAL"]),
    type: z.literal("BILL").default("BILL"),
    notes: z.string().trim().max(240).optional(),
  })
  const part = z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(80),
    amount: getMoneyAmountSchema(messages),
  })

  return z.discriminatedUnion("amountMode", [
    common.extend({
      amountMode: z.literal("FIXED"),
      amount: getMoneyAmountSchema(messages),
      parts: z.array(part).max(0).optional(),
    }),
    common.extend({
      amountMode: z.literal("ITEMIZED"),
      // React Hook Form retains the hidden fixed amount when switching modes.
      // Accept it as input but discard it so itemized totals remain derived only from parts.
      amount: z.unknown().optional().transform(() => undefined),
      parts: z.array(part).min(2, messages.commitmentPartsMinimum).max(20, messages.commitmentPartsMaximum),
    }),
  ])
}

export function getCategoryNameSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.string().trim().min(1, messages.categoryRequired).max(60)
}

function getOptionalSetupMoneyAmountSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined
    }

    return value
  }, getMoneyAmountSchema(messages).optional())
}

function getOptionalSetupItemSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    name: z.string().trim().max(80).optional(),
    amount: getOptionalSetupMoneyAmountSchema(messages),
  })
}

export function getInitialSetupSchema(messages: ValidationMessages = defaultValidationMessages) {
  const optionalSetupItemSchema = getOptionalSetupItemSchema(messages)

  return z
    .object({
      deposits: z.array(optionalSetupItemSchema).min(1),
      monthlyBills: z.array(optionalSetupItemSchema).min(1),
    })
    .transform((setup, context) => {
      const normalizeItems = (items: z.infer<typeof optionalSetupItemSchema>[], label: string) =>
        items.flatMap((item, index) => {
          const hasName = Boolean(item.name)
          const hasAmount = item.amount !== undefined

          if (!hasName && !hasAmount) {
            return []
          }

          if (!hasName || !hasAmount) {
            context.addIssue({
              code: "custom",
              message: messages.incompleteSetupItem.replace("{label}", label).replace("{index}", String(index + 1)),
            })
            return []
          }

          return [
            {
              name: item.name!,
              amount: item.amount!,
            },
          ]
        })

      const deposits = normalizeItems(setup.deposits, messages.setupDepositLabel)
      const monthlyBills = normalizeItems(setup.monthlyBills, messages.setupMonthlyBillLabel)

      if (deposits.length === 0) {
        context.addIssue({
          code: "custom",
          message: messages.setupRequiresDeposit,
        })
      }

      if (monthlyBills.length === 0) {
        context.addIssue({
          code: "custom",
          message: messages.setupRequiresOutflow,
        })
      }

      return {
        deposits,
        monthlyBills,
      }
    })
}

export function getPlanSettingsSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    lowMonthlyMarginPercent: z.coerce
      .number({ message: messages.percentageInvalid })
      .min(0, messages.percentageNegative)
      .max(100, messages.percentageTooLarge),
  })
}

export function getCheckpointSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(80),
  })
}

export const moneyAmountSchema = getMoneyAmountSchema()
export const depositSchema = getDepositSchema()
export const commitmentSchema = getCommitmentSchema()
export const categoryNameSchema = getCategoryNameSchema()
export const initialSetupSchema = getInitialSetupSchema()
export const planSettingsSchema = getPlanSettingsSchema()
export const checkpointSchema = getCheckpointSchema()
export type DepositInput = z.infer<typeof depositSchema>
export type CommitmentInput = z.infer<typeof commitmentSchema>
export type InitialSetupInput = z.infer<typeof initialSetupSchema>
export type PlanSettingsInput = z.infer<typeof planSettingsSchema>
export type CheckpointInput = z.infer<typeof checkpointSchema>
