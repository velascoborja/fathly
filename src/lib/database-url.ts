const WARNING_SSL_MODES = new Set(["prefer", "require", "verify-ca"])

export function normalizeDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString)
  const sslMode = url.searchParams.get("sslmode")
  const usesLibpqCompatibility = url.searchParams.get("uselibpqcompat") === "true"

  if (sslMode && WARNING_SSL_MODES.has(sslMode) && !usesLibpqCompatibility) {
    url.searchParams.set("sslmode", "verify-full")
  }

  return url.toString()
}
