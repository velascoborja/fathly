import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const legacyPages = [
  "src/app/(app)/deposits/page.tsx",
  "src/app/(app)/monthly-bills/page.tsx",
  "src/app/(app)/annual-costs/page.tsx",
  "src/app/(app)/savings/page.tsx",
]

describe("legacy authenticated routes", () => {
  it("redirects all old section pages to the dashboard", () => {
    for (const page of legacyPages) {
      const source = readFileSync(page, "utf8")

      expect(source, page).toContain('redirect("/dashboard")')
      expect(source, page).not.toContain("getBudgetData")
    }
  })
})

describe("root route", () => {
  it("renders a visible loading state before client navigation to the dashboard", () => {
    const source = readFileSync("src/app/page.tsx", "utf8")
    const loadingSource = readFileSync("src/components/app/root-redirect-loading.tsx", "utf8")

    expect(source).toContain("RootRedirectLoading")
    expect(source).not.toContain('redirect("/dashboard")')
    expect(loadingSource).toContain('router.replace("/dashboard")')
    expect(loadingSource).toContain("dictionary.loading.title")
  })
})

describe("settings route", () => {
  it("renders a dedicated settings page", () => {
    const source = readFileSync("src/app/(app)/settings/page.tsx", "utf8")

    expect(source).toContain("SettingsPage")
    expect(source).toContain("HouseholdNameForm")
    expect(source).toContain("PlanSettingsForm")
    expect(source).toContain("updatePlanSettings")
    expect(source).toContain("getActiveHouseholdContext")
    expect(source).not.toContain('redirect("/dashboard")')
  })
})

describe("setup route", () => {
  it("renders onboarding before the first empty dashboard", () => {
    const setupSource = readFileSync("src/app/(app)/setup/page.tsx", "utf8")
    const dashboardSource = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

    expect(setupSource).toContain("SetupPage")
    expect(setupSource).toContain("InitialSetupForm")
    expect(setupSource).toContain("completeInitialSetup")
    expect(setupSource).toContain('redirect("/dashboard")')
    expect(dashboardSource).toContain("onboardingCompletedAt")
    expect(dashboardSource).toContain('redirect("/setup")')
  })
})
