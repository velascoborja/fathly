"use client"

import { useRef, useState, useTransition } from "react"
import { ChevronDownIcon } from "lucide-react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { toast } from "sonner"
import type { HouseholdRole } from "@prisma/client"

import type { Locale, dictionaries } from "@/lib/i18n/dictionaries"
import { switchHousehold } from "@/server/household-actions"
import { CreateHouseholdDialog } from "@/components/app/create-household-dialog"

type Dictionary = (typeof dictionaries)[Locale]

export function HouseholdSelector({
  householdId,
  households,
  dictionary,
}: {
  householdId: string
  households: { id: string; name: string; role: HouseholdRole }[]
  dictionary: Dictionary
}) {
  const [pending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const selectorRef = useRef<HTMLSelectElement>(null)
  return (
    <>
      <div className="relative w-full min-w-0 max-w-64">
        <select
          ref={selectorRef}
          aria-label={dictionary.sharing.switchHousehold}
          aria-busy={pending}
          className="min-h-11 w-full min-w-0 appearance-none truncate rounded-xl border border-border bg-background pl-3 pr-9 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={pending}
          value={householdId}
          onChange={(event) => {
            const id = event.target.value
            if (id === "__create_household__") {
              event.target.value = householdId
              setCreateOpen(true)
              return
            }
            startTransition(async () => {
              try {
                const result = await switchHousehold(id)
                if (result?.error) toast.error(result.error)
              } catch (error) {
                if (isRedirectError(error)) throw error
                toast.error(dictionary.sharing.switchError)
              }
            })
          }}
        >
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name} · {dictionary.sharing.roles[household.role]}
            </option>
          ))}
          <option value="__create_household__">{dictionary.sharing.createHousehold}</option>
        </select>
        <ChevronDownIcon aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
      </div>
      <CreateHouseholdDialog
        dictionary={dictionary}
        open={createOpen}
        onOpenChange={setCreateOpen}
        finalFocus={selectorRef}
      />
    </>
  )
}
