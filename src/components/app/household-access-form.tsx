"use client"

import { type FormEvent, useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import type { HouseholdRole } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { getHouseholdInviteSchema } from "@/lib/validations/household"
import {
  cancelHouseholdInvitation,
  regenerateHouseholdInvitation,
  type InvitationResult,
} from "@/server/household-actions"

type Dictionary = (typeof dictionaries)[Locale]
type HouseholdAccessFormProps = {
  action: (formData: FormData) => Promise<InvitationResult>
  dictionary: Dictionary
  locale: Locale
  householdId: string
  isOwner: boolean
  members: { id: string; role: HouseholdRole; user: { name: string | null; email: string | null } }[]
  invitations: { id: string; email: string; role: HouseholdRole; expiresAt: string }[]
}

export function HouseholdAccessForm({
  action,
  dictionary,
  locale,
  householdId,
  isOwner,
  members,
  invitations,
}: HouseholdAccessFormProps) {
  const [isPending, startTransition] = useTransition()
  const [link, setLink] = useState("")
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({})

  function showResult(result: InvitationResult) {
    if (result.error !== undefined) {
      toast.error(result.error)
      return
    }
    setLink(new URL(result.invitationPath, window.location.origin).href)
    toast.success(dictionary.sharing.created)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = getHouseholdInviteSchema(dictionary.validation).safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
    })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({ email: fieldErrors.email?.[0], role: fieldErrors.role?.[0] })
      return
    }
    setErrors({})
    formData.set("email", parsed.data.email)
    formData.set("role", parsed.data.role)
    startTransition(async () => {
      try {
        const result = await action(formData)
        showResult(result)
        if (result.error === undefined) form.reset()
      } catch {
        toast.error(dictionary.sharing.operationError)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {isOwner ? (
        <>
          <form aria-busy={isPending} className="flex flex-col gap-4" onSubmit={onSubmit}>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="household-share-email">{dictionary.settings.shareAccessEmail}</FieldLabel>
                <Input
                  className="min-h-11"
                  id="household-share-email"
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  disabled={isPending}
                  placeholder={dictionary.settings.shareAccessEmailPlaceholder}
                  type="email"
                  name="email"
                />
                <FieldDescription>{dictionary.sharing.invitationHelp}</FieldDescription>
                <FieldError>{errors.email}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.role)}>
                <FieldLabel htmlFor="household-share-role">{dictionary.sharing.permission}</FieldLabel>
                <select
                  id="household-share-role"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isPending}
                  aria-describedby="household-role-help"
                  aria-invalid={Boolean(errors.role)}
                  name="role"
                  defaultValue="VIEWER"
                >
                  <option value="VIEWER">{dictionary.sharing.roles.VIEWER}</option>
                  <option value="EDITOR">{dictionary.sharing.roles.EDITOR}</option>
                </select>
                <FieldDescription id="household-role-help">
                  {dictionary.sharing.viewerHelp} {dictionary.sharing.editorHelp}
                </FieldDescription>
                <FieldError>{errors.role}</FieldError>
              </Field>
            </FieldGroup>
            <Button className="min-h-11 self-start" disabled={isPending} type="submit">
              {isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : null}
              {isPending ? dictionary.sharing.creating : dictionary.sharing.create}
            </Button>
          </form>
          {link ? (
            <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-muted/40 p-4" aria-live="polite">
              <FieldLabel htmlFor="household-invitation-link">{dictionary.sharing.link}</FieldLabel>
              <Input
                className="min-h-11"
                id="household-invitation-link"
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
              />
              <Button
                className="min-h-11 self-start"
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link)
                    toast.success(dictionary.sharing.copied)
                  } catch {
                    toast.error(dictionary.sharing.copyError)
                  }
                }}
              >
                {dictionary.sharing.copy}
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold">{dictionary.sharing.pending}</h3>
            {!invitations.length ? (
              <p className="text-sm text-muted-foreground">{dictionary.sharing.noPending}</p>
            ) : null}
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {dictionary.sharing.roles[invitation.role]} · {dictionary.sharing.expires}:{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString(locale, { timeZone: "UTC" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-11"
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    title={dictionary.sharing.regenerateHelp}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          showResult(await regenerateHouseholdInvitation(householdId, invitation.id))
                        } catch {
                          toast.error(dictionary.sharing.operationError)
                        }
                      })
                    }
                  >
                    {dictionary.sharing.regenerate}
                  </Button>
                  <Button
                    className="min-h-11"
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          const result = await cancelHouseholdInvitation(householdId, invitation.id)
                          if (result.error) toast.error(result.error)
                          else {
                            setLink("")
                            toast.success(dictionary.sharing.cancelled)
                          }
                        } catch {
                          toast.error(dictionary.sharing.operationError)
                        }
                      })
                    }
                  >
                    {dictionary.sharing.cancel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{dictionary.sharing.ownerOnly}</p>
      )}
      <div className="rounded-xl border border-border bg-muted/40">
        <h3 className="border-b border-border px-4 py-3 text-sm font-bold">{dictionary.settings.membersTitle}</h3>
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" key={member.id}>
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold">
                  {member.user.name ?? member.user.email ?? dictionary.settings.unknownMember}
                </p>
                {member.user.email ? (
                  <p className="break-all text-xs text-muted-foreground">{member.user.email}</p>
                ) : null}
              </div>
              <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                {dictionary.sharing.roles[member.role]}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
