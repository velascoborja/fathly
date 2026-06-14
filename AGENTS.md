# AGENTS.md

Instructions for coding agents working in this repository.

## Communication

- Reply in the language used by the user in their prompt.
- Be direct and concise. Explain assumptions and tradeoffs when they affect implementation.
- Do not revert user changes unless explicitly asked. If the worktree is dirty, preserve unrelated changes.

## Project Overview

Fathly is a household budgeting MVP for checking whether monthly deposits into a shared account cover shared bills, annual prorated costs, and savings allocations.

Core stack:

- Next.js App Router, TypeScript, React Server Components
- React 19 and Next.js 16.2.x
- Tailwind CSS v4 and shadcn/ui components
- Auth.js / NextAuth v5 with Google OAuth
- Prisma 7 with PostgreSQL through `@prisma/adapter-pg`
- Zod, React Hook Form, Recharts, Vitest, Playwright

## Repository Structure

- `src/app/` - App Router routes, layouts, manifest, API routes, and global CSS.
- `src/app/(app)/` - authenticated app routes.
- `src/app/demo/` - static demo route that should work without OAuth, Postgres, or `.env`.
- `src/components/` - app, budget, and reusable UI components.
- `src/lib/` - budget math/formatting, i18n, Prisma, validations, utilities.
- `src/server/` - server actions and household context.
- `src/auth.ts` - Auth.js setup.
- `prisma/` - Prisma schema, migrations, seed.
- `tests/unit/` - Vitest unit tests.
- `tests/e2e/` - Playwright smoke tests.
- `DESIGN.md` - Canva-inspired visual design system. Follow it for UI work.

## Development Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Generate Prisma client: `npm run db:generate`
- Run migrations: `npm run db:migrate`
- Seed database: `npm run db:seed`

Use focused verification for small changes, but run `npm run lint` and the relevant tests before finishing meaningful code edits.

## Environment

Required local environment variables are documented in `.env.example`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL`
- `DATABASE_URL`

The `/demo` route should remain usable without OAuth, PostgreSQL, or a `.env` file.

## Coding Conventions

- Use the `@/` path alias for imports from `src`.
- Prefer Server Components by default. Add `"use client"` only where interactivity, browser APIs, or client hooks require it.
- Keep server-only behavior in server components, server actions, or `src/server/*`.
- Validate form input with the existing Zod schemas in `src/lib/validations/*`.
- Store money as integer cents. Use existing budget helpers in `src/lib/budget/*` rather than floating point math.
- Respect household and active plan scoping when reading or mutating budget data.
- Revalidate affected routes after mutations. Existing budget mutations currently use `revalidateBudgetPaths()`.
- Keep Prisma schema changes paired with migrations.
- Keep comments sparse and useful.

## UI and Design

- Follow `DESIGN.md` for the Canva-inspired design system.
- Use existing `src/components/ui/*` primitives and local component patterns before adding new abstractions.
- Preserve the bright white/lavender surface system, purple primary accents, magenta/coral/cyan support accents, rounded forms, pill buttons, colorful elevation, and card accents.
- Ensure responsive layouts work on desktop and mobile without clipping or overlap.
- Keep touch targets at least 36px on desktop and larger on mobile.
- Use `lucide-react` for icons unless the existing UI pattern calls for something else.

## Internationalization

- Default UI language is Spanish (`es`), with English (`en`) available.
- Add or update copy in both locales in `src/lib/i18n/dictionaries.ts`.
- Locale selection is stored in the `fathly-locale` cookie.
- Keep currency formatting in EUR unless a feature explicitly changes that.

## Testing Guidance

- Unit tests use Vitest with files in `tests/unit/**/*.test.ts`.
- E2E tests use Playwright with desktop Chromium and Pixel 7 projects.
- Add or update tests for changed budget math, validations, i18n copy behavior, app-shell layout behavior, auth guard behavior, and user-facing workflows.
- For UI changes, verify the demo route or the affected authenticated route in a browser when feasible.
- Always run and verify that unit tests pass after implementing each feature. If any tests fail, correct the code or tests.

## Git Hygiene

- Check `git status --short` before editing and before final response.
- Do not include unrelated files in commits or summaries.
- Do not run destructive git commands such as `git reset --hard` or `git checkout --` unless explicitly requested.
