# Single Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar-routed authenticated app with one CreateSpace-styled dashboard that contains summary, data creation, charts, data tables, and account/settings controls.

**Architecture:** Keep the App Router server-page data flow. Use a simplified authenticated shell for top-level chrome, a richer `/dashboard` server component for all budget data, existing server actions for mutations/revalidation, and redirect-only legacy pages.

**Tech Stack:** Next 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/base-ui primitives, Prisma-backed server actions, Vitest, Playwright.

---

### Task 1: Test the New Shell and Route Contract

**Files:**
- Modify: `tests/unit/app-shell-layout.test.ts`
- Modify: `tests/unit/page-heading-spacing.test.ts`
- Create: `tests/unit/single-dashboard-routes.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/app-shell-layout.test.ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/components/app/app-shell.tsx", "utf8")

describe("AppShell layout", () => {
  it("uses dashboard-only chrome without sidebar or mobile route navigation", () => {
    expect(source).not.toContain("@/components/ui/sidebar")
    expect(source).not.toContain("Primary mobile navigation")
    expect(source).not.toContain("dictionary.nav.deposits")
    expect(source).not.toContain("dictionary.nav.monthlyBills")
    expect(source).toContain("setLocaleAction")
    expect(source).toContain("signOutUser")
    expect(source).toContain("householdName")
  })
})
```

```ts
// tests/unit/page-heading-spacing.test.ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("dashboard heading spacing", () => {
  it("keeps the dashboard title and subtitle visually grouped", () => {
    const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

    expect(source).toContain("mt-2")
  })
})
```

```ts
// tests/unit/single-dashboard-routes.test.ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const legacyPages = [
  "src/app/(app)/deposits/page.tsx",
  "src/app/(app)/monthly-bills/page.tsx",
  "src/app/(app)/annual-costs/page.tsx",
  "src/app/(app)/savings/page.tsx",
  "src/app/(app)/settings/page.tsx",
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
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/app-shell-layout.test.ts tests/unit/page-heading-spacing.test.ts tests/unit/single-dashboard-routes.test.ts`

Expected: FAIL because the shell still imports sidebar components and legacy pages still render data.

### Task 2: Implement Shell, Fonts, Theme, and Redirects

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/app/app-shell.tsx`
- Modify: `src/app/(app)/deposits/page.tsx`
- Modify: `src/app/(app)/monthly-bills/page.tsx`
- Modify: `src/app/(app)/annual-costs/page.tsx`
- Modify: `src/app/(app)/savings/page.tsx`
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/server/actions.ts`

- [ ] **Step 1: Replace fonts and theme tokens**

Use `Poppins`, `DM_Sans`, and `Fira_Code` from `next/font/google`. Update CSS variables to CreateSpace colors and add glass/surface utility classes.

- [ ] **Step 2: Replace AppShell sidebar with top-bar shell**

Render a single app chrome with brand, household name, language toggle, and sign out. Keep `children` in a full-width dashboard container.

- [ ] **Step 3: Redirect legacy pages**

Each old section page imports `redirect` from `next/navigation` and default exports a function calling `redirect("/dashboard")`.

- [ ] **Step 4: Update revalidation**

Keep `revalidatePath("/dashboard")` and remove no-longer-needed assumptions from mutation flow.

- [ ] **Step 5: Verify green for shell/route tests**

Run: `npm test -- tests/unit/app-shell-layout.test.ts tests/unit/page-heading-spacing.test.ts tests/unit/single-dashboard-routes.test.ts`

Expected: PASS.

### Task 3: Test and Implement Dashboard Consolidation

**Files:**
- Create: `tests/unit/dashboard-command-center.test.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/budget/item-table.tsx`
- Modify: `src/components/budget/commitment-chart.tsx`
- Modify: `src/lib/i18n/dictionaries.ts`

- [ ] **Step 1: Write failing dashboard structure test**

```ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8")

describe("dashboard command center", () => {
  it("renders all budget management surfaces on the dashboard", () => {
    expect(source).toContain("BudgetCommandPanel")
    expect(source).toContain("BudgetDataSection")
    expect(source).toContain("dictionary.nav.deposits")
    expect(source).toContain("dictionary.nav.monthlyBills")
    expect(source).toContain("dictionary.nav.annualCosts")
    expect(source).toContain("dictionary.nav.savings")
    expect(source).toContain("HouseholdNameForm")
    expect(source).toContain("CommitmentChart")
  })
})
```

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/unit/dashboard-command-center.test.ts`

Expected: FAIL because the new dashboard components do not exist.

- [ ] **Step 3: Implement dashboard**

Add command panel, summary grid, chart panel, four data lanes, and dashboard settings area. Use existing `BudgetDialogForm`, `DepositTable`, `CommitmentTable`, and `HouseholdNameForm`.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/unit/dashboard-command-center.test.ts`

Expected: PASS.

### Task 4: Full Verification and Rendered QA

**Files:**
- No committed source files unless fixing verification failures.

- [ ] **Step 1: Run unit suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run Playwright smoke test**

Run: `npm run test:e2e`

Expected: Existing auth/demo smoke tests pass.

- [ ] **Step 5: Render dashboard/demo QA**

Start `npm run dev`, capture desktop and mobile screenshots with Playwright fallback, and inspect for blank page, framework overlay, console errors, clipping, overlap, unreadable text, and responsive breakage.
