"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { householdInviteSchema, type HouseholdInviteInput } from "@/lib/validations/household"

type Dictionary = (typeof dictionaries)[Locale]

type HouseholdMember = {
  id: string
  role: "OWNER" | "MEMBER"
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
}

type HouseholdAccessFormProps = {
  action: (formData: FormData) => Promise<void>
  dictionary: Dictionary
  isOwner: boolean
  members: HouseholdMember[]
}

export function HouseholdAccessForm({
  action,
  dictionary,
  isOwner,
  members,
}: HouseholdAccessFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const form = useForm<HouseholdInviteInput>({
    resolver: zodResolver(householdInviteSchema) as unknown as Resolver<HouseholdInviteInput>,
    defaultValues: { email: "" },
  })

  function onSubmit(values: HouseholdInviteInput) {
    const formData = new FormData()
    formData.set("email", values.email)

    startTransition(async () => {
      try {
        await action(formData)
        form.reset({ email: "" })
        router.refresh()
        toast.success(dictionary.settings.shareAccessSaved)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : dictionary.settings.shareAccessError)
      }
    })
  }

  const error = form.formState.errors.email

  return (
    <div className="flex flex-col gap-5">
      <form aria-busy={isPending} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-disabled={isPending || !isOwner} data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="household-share-email">{dictionary.settings.shareAccessEmail}</FieldLabel>
            <Input
              id="household-share-email"
              aria-invalid={Boolean(error)}
              autoComplete="email"
              disabled={isPending || !isOwner}
              inputMode="email"
              placeholder={dictionary.settings.shareAccessEmailPlaceholder}
              type="email"
              {...form.register("email")}
            />
            <FieldDescription>
              {isOwner ? dictionary.settings.shareAccessHelp : dictionary.settings.shareAccessOwnerOnly}
            </FieldDescription>
            <FieldError>{error?.message}</FieldError>
          </Field>
        </FieldGroup>
        <Button className="self-start" disabled={isPending || !isOwner} type="submit">
          {isPending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {isPending ? dictionary.settings.sharingAccess : dictionary.settings.shareAccessAction}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-muted/40">
        <div className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">
          {dictionary.settings.membersTitle}
        </div>
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" key={member.id}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {member.user.name ?? member.user.email ?? dictionary.settings.unknownMember}
                </p>
                {member.user.email && (
                  <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                )}
              </div>
              <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                {member.role === "OWNER" ? dictionary.settings.ownerRole : dictionary.settings.memberRole}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
