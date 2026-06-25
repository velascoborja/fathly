import { RootRedirectLoading } from "@/components/app/root-redirect-loading"
import { getServerDictionary } from "@/lib/i18n/server"

export default async function Home() {
  const dictionary = await getServerDictionary()

  return <RootRedirectLoading dictionary={dictionary} />
}
