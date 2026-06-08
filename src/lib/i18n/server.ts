import { cookies } from "next/headers"

import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionaries"

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get("fathly-locale")?.value

  return isLocale(locale) ? locale : "es"
}

export async function getServerDictionary() {
  return getDictionary(await getLocale())
}
