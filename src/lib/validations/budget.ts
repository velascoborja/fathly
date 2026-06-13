import { z } from "zod"

import { commitmentIconValues } from "@/lib/budget/commitment-icons"

export const moneyAmountSchema = z.coerce
  .number({ message: "Enter a valid amount." })
  .positive("Amount must be greater than zero.")
  .max(1_000_000, "Amount is too large.")

export const depositSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  amount: moneyAmountSchema,
  notes: z.string().trim().max(240).optional(),
})

export const commitmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  amount: moneyAmountSchema,
  category: z.string().trim().min(1, "Category is required.").max(60),
  icon: z.enum(commitmentIconValues).default("receipt"),
  frequency: z.enum(["MONTHLY", "ANNUAL"]),
  type: z.enum(["BILL", "SAVINGS"]),
  notes: z.string().trim().max(240).optional(),
})

export const planSettingsSchema = z.object({
  lowMonthlyMarginPercent: z.coerce
    .number({ message: "Enter a valid percentage." })
    .min(0, "Percentage cannot be negative.")
    .max(100, "Percentage cannot be greater than 100."),
})

export type DepositInput = z.infer<typeof depositSchema>
export type CommitmentInput = z.infer<typeof commitmentSchema>
export type PlanSettingsInput = z.infer<typeof planSettingsSchema>
