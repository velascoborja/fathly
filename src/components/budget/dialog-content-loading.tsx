import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/lib/i18n/dictionaries"

export function DialogContentLoading({ labels, loadError, reload }: {
  labels: Dictionary["loading"]
  loadError: boolean
  reload: () => void
}) {
  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <p role="alert">{labels.contentError}</p>
        <Button onClick={reload} type="button" variant="outline">{labels.reloadPage}</Button>
      </div>
    )
  }

  return (
    <div aria-busy="true" className="flex items-center gap-3 py-8 text-muted-foreground" role="status">
      <Loader2Icon aria-hidden="true" className="size-5 animate-spin" />
      {labels.form}
    </div>
  )
}
