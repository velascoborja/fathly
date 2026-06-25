"use client"

import { useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

import { AppIcon } from "@/components/app/app-icon"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type RootRedirectLoadingProps = {
  dictionary: Dictionary
}

export function RootRedirectLoading({ dictionary }: RootRedirectLoadingProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return (
    <main
      aria-busy="true"
      aria-label={dictionary.loading.ariaLabel}
      className="flex min-h-svh items-center justify-center bg-background p-4"
    >
      <section className="fathly-hero flex w-full max-w-md flex-col items-center gap-5 p-6 text-center">
        <AppIcon className="size-16" size={64} />
        <div className="flex flex-col gap-2">
          <p className="fathly-wordmark justify-center text-lg">{dictionary.appName}</p>
          <h1 className="text-2xl font-bold leading-tight text-foreground">{dictionary.loading.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{dictionary.loading.body}</p>
        </div>
        <Loader2Icon className="size-6 animate-spin text-primary" aria-hidden="true" />
      </section>
    </main>
  )
}
