import { z } from "zod"

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
  frequency: z.enum(["MONTHLY", "ANNUAL"]),
  type: z.enum(["BILL", "SAVINGS"]),
  notes: z.string().trim().max(240).optional(),
})

export type DepositInput = z.infer<typeof depositSchema>
export type CommitmentInput = z.infer<typeof commitmentSchema>
