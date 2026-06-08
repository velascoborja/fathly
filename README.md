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

## Scripts

- `npm run dev` starts the Next.js dev server.
- `npm run build` verifies the production build.
- `npm run lint` runs ESLint.
- `npm test` runs unit tests.
- `npm run test:e2e` runs Playwright smoke tests.
- `npm run db:seed` runs the no-data seed placeholder.

## MVP Notes

- Default UI language is Spanish with an English toggle.
- Currency formatting is EUR.
- The Excel workbook is product reference only; there is no import or seeded budget data in the MVP.
- The first authenticated visit creates one household and one active budget plan for the signed-in user.
