"use client"

import { useEffect, useState } from "react"

export function useDeferredContent<T>(load: () => Promise<T>, enabled: boolean) {
  const [Content, setContent] = useState<T | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!enabled || Content) return

    let cancelled = false
    load().then(
      (content) => {
        if (!cancelled) {
          setContent(() => content)
          setLoadError(false)
        }
      },
      () => {
        if (!cancelled) setLoadError(true)
      }
    )

    return () => { cancelled = true }
  }, [enabled, Content, load])

  function reload() {
    setLoadError(false)
    window.location.reload()
  }

  return { Content, loadError, reload }
}
