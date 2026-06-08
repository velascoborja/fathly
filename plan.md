# Fathly MVP Plan

## Summary

- Build a new root-level Next.js App Router MVP in this repo, preserving `mvp.md` and `DESIGN.md`.
- Product focus: one active household budget that answers whether shared-account monthly deposits cover shared commitments.
- No Excel import or seeded financial data. The workbook is product reference only.
- Visual target: the approved generated dashboard concept from planning.
- UI supports Spanish and English from day one; default locale is Spanish, with an English toggle. Currency is EUR.

## Key Changes

- Scaffold with latest stable Next.js, TypeScript, App Router, Tailwind, ESLint, and `src/` layout. Use `pnpm`; scaffold in a temp directory first, then merge into this non-empty repo.
- Add shadcn/ui, Recharts, React Hook Form, Zod, Prisma, Auth.js, and the Auth.js Prisma adapter.
- Use Neon PostgreSQL through standard `DATABASE_URL`; keep Prisma provider-neutral PostgreSQL so the DB can be swapped later.
- Auth: Google OAuth only. Protected app routes require an authenticated user and membership in the single active household.
- App routes: sign-in page, dashboard, deposits, monthly bills, annual costs, savings, and settings. Sidebar collapses on mobile.
- Data model:
  - Auth.js tables: `User`, `Account`, `Session`, `VerificationToken`.
  - Fathly tables: `Household`, `HouseholdMember`, `BudgetPlan`, `Deposit`, `Commitment`.
  - `BudgetPlan` supports one active current plan now, while leaving room for future history/scenarios.
  - `Deposit` stores shared-account inflows only.
  - `Commitment` stores bills, annual prorated costs, and savings allocations with category, frequency, amount, notes, status, and sort order.
- Calculations:
  - Monthly deposits = sum of active deposits.
  - Monthly commitments = monthly items + annual items prorated by 12 + savings allocations.
  - Coverage = deposits minus commitments.
  - Annual items are stored as annual amounts and normalized to monthly cents for dashboard totals.
- Forms use shared Zod schemas and React Hook Form; mutations use Server Actions with server-side validation and household authorization.
- Bilingual UI uses typed local dictionaries, not a heavy i18n framework. Store the selected locale in a cookie/user preference.

## UI Behavior

- Dashboard mirrors the approved concept: coverage card, KPI cards, grouped commitments table, commitment breakdown chart, largest commitments, "Add bill", and "Adjust deposits".
- Empty first-use state guides the user to add deposits first, then bills/commitments.
- Add/edit flows use dialogs or sheets with immediate pending/disabled states and toast feedback.
- Mobile layout stacks KPI cards, moves charts below the table, and collapses the sidebar into a drawer.

## Test Plan

- Unit tests for coverage math, annual proration, grouping, and EUR formatting.
- Zod validation tests for deposits and commitments.
- Server Action tests for auth/household authorization and CRUD behavior.
- Playwright smoke tests for sign-in guard, empty onboarding, adding deposits, adding bills, editing annual costs, bilingual toggle, and mobile layout.
- Visual QA compares the implemented dashboard against the approved concept on desktop and mobile.

## Assumptions

- Package manager: `pnpm`.
- Hosted DB target: Neon, but only standard Postgres connection strings are required.
- Default locale: Spanish; English is available via toggle.
- Out of scope for MVP: Excel import, historical budget versions, scenario comparison, bank sync, transaction tracking, personal salary budgeting, invites, roles UI, and multiple households.
- Official docs checked: [Next.js create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app), [Next.js App Router](https://nextjs.org/docs/app), [shadcn Next install](https://ui.shadcn.com/docs/installation/next), [Auth.js Google provider](https://authjs.dev/reference/core/providers/google), [Auth.js Prisma adapter](https://authjs.dev/getting-started/adapters/prisma), and [Prisma Next.js guide](https://www.prisma.io/docs/guides/frameworks/nextjs).
