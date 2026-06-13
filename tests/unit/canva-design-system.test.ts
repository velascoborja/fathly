import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const globals = readFileSync("src/app/globals.css", "utf8")
const button = readFileSync("src/components/ui/button.tsx", "utf8")
const card = readFileSync("src/components/ui/card.tsx", "utf8")
const dashboard = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")
const shell = readFileSync("src/components/app/app-shell.tsx", "utf8")
const design = readFileSync("DESIGN.md", "utf8")

describe("Canva visual system", () => {
  it("documents and exposes the Canva-inspired color tokens", () => {
    expect(design).toContain("name: Canva")
    expect(globals).toContain("--primary: #7b2fbe")
    expect(globals).toContain("--secondary: #00c4cc")
    expect(globals).toContain("--accent-dark: #ff6b9d")
    expect(globals).toContain("--background: #ffffff")
    expect(globals).not.toContain("#121212")
  })

  it("uses rounded pill buttons with purple elevation", () => {
    expect(button).toContain("rounded-full")
    expect(button).toContain("shadow-[0_8px_20px_rgba(123,47,190,0.22)]")
    expect(button).toContain("cubic-bezier(0.34,1.56,0.64,1)")
  })

  it("uses bright rounded app-canvas surfaces across app chrome", () => {
    expect(card).toContain("rounded-[20px]")
    expect(card).toContain("shadow-[0_2px_8px_rgba(0,0,0,0.08)]")
    expect(shell).toContain("fathly-wordmark")
    expect(dashboard).toContain("fathly-hero")
    expect(dashboard).toContain("bg-[#f1feff]")
  })
})
