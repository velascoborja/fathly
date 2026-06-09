import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const globals = readFileSync("src/app/globals.css", "utf8")
const button = readFileSync("src/components/ui/button.tsx", "utf8")
const card = readFileSync("src/components/ui/card.tsx", "utf8")
const dashboard = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")
const shell = readFileSync("src/components/app/app-shell.tsx", "utf8")
const design = readFileSync("DESIGN.md", "utf8")

describe("Flip7 visual system", () => {
  it("documents and exposes the Flip7 color tokens", () => {
    expect(design).toContain("Flip7 Design System")
    expect(globals).toContain("--primary: #2ba8a2")
    expect(globals).toContain("--accent: #ffd23f")
    expect(globals).toContain("--coral: #ef6c4a")
    expect(globals).toContain("--cream: #fff8e7")
    expect(globals).not.toContain("#e11d48")
  })

  it("uses rounded pill buttons with colored glow treatments", () => {
    expect(button).toContain("rounded-full")
    expect(button).toContain("shadow-[0_4px_20px_rgba(255,210,63,0.40)]")
    expect(button).toContain("active:not-aria-[haspopup]:scale-95")
  })

  it("uses tactile scoring-card surfaces across app chrome", () => {
    expect(card).toContain("border-l-[6px]")
    expect(card).toContain("shadow-[0_4px_20px_rgba(43,168,162,0.10)]")
    expect(shell).toContain("fathly-ribbon")
    expect(dashboard).toContain("fathly-hero")
    expect(dashboard).toContain("border-l-accent")
  })
})
