# Fathly

Fathly is a household budgeting MVP for checking whether monthly deposits into a shared account cover shared bills, annual prorated costs, and savings allocations.

## Stack

- Next.js App Router with TypeScript and React Server Components
- Tailwind CSS v4 and shadcn/ui
- Auth.js with Google OAuth
- Prisma 7 with PostgreSQL through a driver adapter
- React Hook Form, Zod, Recharts, Vitest, and Playwright

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set:

   ```bash
   AUTH_SECRET=
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=
   AUTH_URL=http://localhost:3000
   DATABASE_URL=
   ```

3. Generate Prisma Client and run migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Mock Demo

You can preview the product UI without OAuth, Postgres, or a `.env` file:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/demo
```

The demo uses static mock data and does not save changes.

## Scripts

- `npm run dev` starts the Next.js dev server.
- `npm run build` verifies the production build.
- `npm run lint` runs ESLint.
- `npm test` runs unit tests.
- `npm run test:e2e` runs Playwright smoke tests.
- `npm run db:seed` runs the no-data seed placeholder.

Playwright covers desktop Chromium, Pixel 7, and iPhone 13 through WebKit. Install the browser binaries with `npx playwright install chromium webkit` before running E2E tests. The startup tests pause the HTML response and JavaScript downloads to check the initial skeleton in light and dark appearances.

The authenticated loading and editor tests are opt-in:

```bash
FATHLY_E2E_DATABASE=1 npm run test:e2e
```

They require a configured PostgreSQL database with the migrations applied. Each test creates its own user, session, and household and removes them afterward; Google OAuth is not needed.

## MVP Notes

- Default UI language is Spanish with an English toggle.
- Currency formatting is EUR.
- The Excel workbook is product reference only; there is no import or seeded budget data in the MVP.
- The first authenticated visit creates one household and one active budget plan for the signed-in user.

## Household invitations

In **Settings → Share access**, an owner enters an email, chooses **Viewer** or **Editor**, and creates a link to share manually. Links expire after seven days and can be regenerated or cancelled. Regenerating a link invalidates the previous one. Only the invited, verified Google email can accept; acceptance adds access without moving or combining existing budgets.

Viewers can read budgets and checkpoints. Editors can also change budget data and checkpoints. Household naming, budget settings, and invitations are owner-only. Changing accepted members' roles and removing members are deferred.

A household selector appears when someone belongs to multiple households. Selection is remembered in that browser. Creating additional personal or shared spaces is deferred; existing households remain independent.

Deleting an account removes access to every household. A sole owner of a shared household must explicitly choose a successor for each such household. Households with no remaining members are deleted with their budgets.

### Applying the sharing migration

The migration replaces `MEMBER` with `EDITOR` and adds `VIEWER` and invitation storage. Existing memberships and budgets are preserved. Apply it together with the matching app version:

```bash
npx prisma migrate deploy
npm run db:generate
```

Sharing browser tests use the existing opt-in database fixtures. Run them only against a development or isolated test database with migrations applied:

```bash
FATHLY_E2E_DATABASE=1 npm run test:e2e -- tests/e2e/household-sharing.spec.ts
```

### Repairing households from legacy first-time setup

The old first-visit setup could create two households when requests arrived concurrently. The household selector can expose those existing records. First visits now lock the user row and recheck membership before creating a household.

Preview untouched duplicates without changing the configured database:

```bash
npx tsx scripts/repair-duplicate-households.ts
```

After reviewing the preview, remove only those empty duplicates:

```bash
npx tsx scripts/repair-duplicate-households.ts --apply
```

The repair only considers same-name households created within one second of an earlier household for the same owner, before the sharing release. It preserves households with budget entries, completed setup, changed plan settings, multiple members, or invitations. It rechecks under database locks and writes a private recovery backup in the system temporary directory before removal. Review households with data separately; the repair never merges them.
