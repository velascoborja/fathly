"use client"

import { useState, useTransition } from "react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function InvitationAcceptButton({
  action,
  label,
  pendingLabel,
  errorLabel,
}: {
  action: () => Promise<{ error: string }>
  label: string
  pendingLabel: string
  errorLabel: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="min-h-11"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            setError("")
            try {
              const result = await action()
              setError(result.error)
            } catch (error) {
              if (isRedirectError(error)) throw error
              setError(errorLabel)
            }
          })
        }
      >
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        {pending ? pendingLabel : label}
      </Button>
    </div>
  )
}
