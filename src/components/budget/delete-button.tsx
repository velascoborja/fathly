"use client"

import { useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type DeleteButtonProps = {
  action: () => Promise<void>
  label: string
}

export function DeleteButton({ action, label }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      aria-label={label}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await action()
            toast.success(label)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete.")
          }
        })
      }}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <Trash2Icon />
    </Button>
  )
}
