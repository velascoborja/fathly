import { z } from "zod"

import { dictionaries, type Locale } from "@/lib/i18n/dictionaries"

type ValidationMessages = (typeof dictionaries)[Locale]["validation"]

const defaultValidationMessages = dictionaries.es.validation

export function getHouseholdNameSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.string().trim().min(1, messages.nameRequired).max(80)
}

export function getHouseholdNameFormSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    name: getHouseholdNameSchema(messages),
  })
}

export function getHouseholdInviteSchema(messages: ValidationMessages = defaultValidationMessages) {
  return z.object({
    email: z.string().trim().toLowerCase().max(254).email(messages.emailInvalid),
  })
}

export const householdNameSchema = getHouseholdNameSchema()
export const householdNameFormSchema = getHouseholdNameFormSchema()
export const householdInviteSchema = getHouseholdInviteSchema()

export type HouseholdNameInput = z.infer<typeof householdNameSchema>
export type HouseholdNameFormInput = z.infer<typeof householdNameFormSchema>
export type HouseholdInviteInput = z.infer<typeof householdInviteSchema>
