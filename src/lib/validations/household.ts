import { z } from "zod"

export const householdNameSchema = z.string().trim().min(1, "Name is required.").max(80)
export const householdNameFormSchema = z.object({
  name: householdNameSchema,
})
export const householdInviteSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email."),
})

export type HouseholdNameInput = z.infer<typeof householdNameSchema>
export type HouseholdNameFormInput = z.infer<typeof householdNameFormSchema>
export type HouseholdInviteInput = z.infer<typeof householdInviteSchema>
