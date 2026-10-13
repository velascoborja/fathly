import { cloneElement, createElement, use, type ReactNode } from "react"
import { renderToReadableStream } from "react-dom/server.edge"
import { describe, expect, it, vi } from "vitest"

import AuthenticatedLayout from "@/app/(app)/layout"
import Loading from "@/app/loading"
import RootLayout, { viewport } from "@/app/layout"
import { AppShellLoading } from "@/components/app/app-shell-loading"
import { dictionaries } from "@/lib/i18n/dictionaries"

const { getContext } = vi.hoisted(() => ({ getContext: vi.fn() }))

vi.mock("@/server/household", () => ({ getActiveHouseholdContext: getContext }))
vi.mock("@/lib/i18n/server", () => ({
  getLocale: async () => "es",
  getServerDictionary: async () => dictionaries.es,
}))
vi.mock("@/components/app/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-sans" }),
  Fira_Code: () => ({ variable: "font-mono" }),
}))

describe("initial loading", () => {
  it("uses the server-rendered shell as the global route fallback", () => {
    expect(Loading).toBe(AppShellLoading)
  })

  it("declares a light canvas in the initial document before external CSS loads", () => {
    expect(viewport).toEqual({ colorScheme: "light", themeColor: "#ffffff" })
    const document = RootLayout({ children: null })
    expect(document.props.style).toEqual({ backgroundColor: "#ffffff", colorScheme: "light" })
    expect(document.props.children.props.style.backgroundColor).toBe("#ffffff")
  })

  it("streams the skeleton before resolving the session and household", async () => {
    let resolveContext!: (context: unknown) => void
    getContext.mockReturnValue(new Promise((resolve) => { resolveContext = resolve }))
    const layout = AuthenticatedLayout({ children: createElement("h1", null, "Budget ready") })
    // Resolve the async Server Component as RSC does, then stream its DOM boundary.
    const content: Promise<ReactNode> = layout.props.children.type(layout.props.children.props)
    function ServerContent() {
      return use(content)
    }
    const stream = await renderToReadableStream(
      createElement("div", null, cloneElement(layout, undefined, createElement(ServerContent)))
    )
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    try {
      const firstChunk = await reader.read()
      const initialHTML = decoder.decode(firstChunk.value)
      expect(initialHTML).toContain('data-slot="skeleton"')
      expect(initialHTML).toContain('aria-busy="true"')
      expect(initialHTML).toContain('aria-hidden="true"')
      expect(initialHTML).toContain(dictionaries.es.loading.ariaLabel)
      expect(initialHTML).not.toContain("Budget ready")
    } finally {
      resolveContext({ household: { name: "Test household" }, user: { id: "test-user" } })
    }

    let completedHTML = ""
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      completedHTML += decoder.decode(chunk.value)
    }
    expect(completedHTML).toContain("Budget ready")
  })
})
