import { z } from "zod"

export const householdNameSchema = z.string().trim().min(1, "Name is required.").max(80)
export const householdNameFormSchema = z.object({
  name: householdNameSchema,
})

export type HouseholdNameInput = z.infer<typeof householdNameSchema>
export type HouseholdNameFormInput = z.infer<typeof householdNameFormSchema>
