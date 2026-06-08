# Technical Requirements

## Technology Stack

The MVP should be built using the following technologies:

### Frontend & Backend

- Next.js (latest stable version)
- App Router architecture
- TypeScript
- React Server Components where appropriate
- Server Actions for data mutations

### Database

- PostgreSQL

Recommended providers:

- Neon PostgreSQL
- Prisma Postgres

The application should be designed so the database provider can be swapped without major code changes.

### ORM

- Prisma

Requirements:

- Schema-driven database design
- Type-safe database access
- Migration support
- Seed data support

### Authentication

- Auth.js (NextAuth)
- Google OAuth provider

Requirements:

- Google Sign In
- Session management
- Protected routes
- Household-level authorization

### UI

- Tailwind CSS
- shadcn/ui

Requirements:

- Responsive design
- Accessible components
- Clean modern appearance
- Mobile-first approach

### Forms & Validation

- React Hook Form
- Zod

Requirements:

- Client-side validation
- Server-side validation
- Shared validation schemas

### Charts & Analytics

- Recharts

Used for:

- Income breakdown
- Commitment breakdown
- Savings allocation
- Budget distribution

### Hosting

- Vercel

Requirements:

- Production deployment
- Preview deployments
- Environment variable management

---

# Architecture Principles

## Server First

Prefer Server Components whenever possible.

Only use Client Components when interactivity requires them.

---

## Type Safety

The entire application should be fully typed using TypeScript.

Avoid:

- any
- untyped API responses
- duplicated data models

Types should be derived from Prisma and Zod schemas whenever possible.

---

## Simplicity

This project is intentionally a relatively simple CRUD and analytics application.

Avoid introducing:

- Redux
- Complex state management libraries
- Event sourcing
- CQRS
- Microservices
- Premature optimization

The application should remain easy for a solo developer to maintain.

---

## Data Ownership

All financial data belongs to a Household.

Users are members of a Household.

Authorization should always verify:

- User is authenticated
- User belongs to the household
- User has permission to perform the action

---

## Database Design Goals

The database should support future expansion without requiring major redesign.

Expected future features include:

- Historical budget versions
- Scenario planning
- Multiple households per user
- Financial forecasting

Even if these features are not implemented in the MVP, the schema should not prevent them.

---

## Performance Goals

The application should feel instant for typical household datasets.

Expected scale:

- Less than 10 household members
- Less than 100 income sources
- Less than 500 financial items

Optimization beyond this scale is not required for MVP.

---

## MVP Development Philosophy

When choosing between:

1. Simpler implementation
2. More scalable implementation

Prefer the simpler implementation unless scalability is required for future roadmap items.

The goal of Fathly is to replace household budgeting spreadsheets, not to become an enterprise finance platform.