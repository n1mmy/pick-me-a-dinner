# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

**Do not commit after making changes.** Only create commits when explicitly asked to.

Before committing, always run the linter and unit tests:
```bash
npm run lint          # must pass with no errors
npm run test:unit     # must pass (does not require DATABASE_URL)
```

## Commands

```bash
npm run dev           # start dev server (localhost:3000)
npm run build         # production build
npm run lint          # run ESLint
npm run test          # run all tests (requires DATABASE_URL)
npm run test:unit     # run unit tests (no database required)
npm run test:db       # run database integration tests (requires DATABASE_URL)
npm run test:watch    # run tests in watch mode
npm run db:migrate    # create and apply a new migration (requires DATABASE_URL)
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:seed       # seed the database with sample data
```

Local dev with Docker (app + postgres):
```bash
docker-compose up
```

Run migrations manually:
```bash
npx prisma migrate deploy
```

## Architecture

**Stack**: Next.js 16 (App Router, TypeScript), Prisma 7 + PostgreSQL, Tailwind CSS 4.

**Prisma v7 note**: Prisma 7 requires a driver adapter — there is no `url` in `schema.prisma`. The connection string is passed at runtime via `PrismaPg` adapter in `src/lib/db.ts`. Client is generated to `src/generated/prisma/` (gitignored; regenerated on `postinstall`).

**Data model** (`prisma/schema.prisma`):
- `Restaurant` — name, orderUrl, phoneNumber, notes
- `Meal` — homecooked meal with name and notes
- `Dinner` — multiple allowed per date, references either a Restaurant or a Meal, with a `DinnerType` enum (RESTAURANT | HOMECOOKED)

**Pages** (all `force-dynamic` server components):
- `/` — home: tonight's dinner + last 7 nights + "Pick for me" button
- `/add` — add/edit dinner for a date; query params: `date`, `type`, `suggestedId`
- `/history` — paginated full history (30/page)
- `/restaurants` — CRUD for restaurants
- `/meals` — CRUD for homecooked meals

**Server Actions** live in `src/app/actions/` (restaurants.ts, meals.ts, dinners.ts). Pages use Server Components + Server Actions — no API routes.

**Random picker** (`pickAndRedirect` in `dinners.ts`): scores all options by days since last use (capped at 21), picks randomly from the highest-scoring tier, then redirects to `/add` with the suggestion pre-filled.

**Add dinner page**: `src/app/add/page.tsx` (server, fetches data) + `src/app/add/AddDinnerForm.tsx` (client component, handles restaurant/homecooked toggle). Inline create uses a `<details>` element that posts to `createRestaurantAndReturn` / `createMealAndReturn`, which create the entry and redirect back to `/add`.

**Deployment**: multi-stage Dockerfile (node:20-alpine), runs `prisma migrate deploy` before starting. Kubernetes manifests in `k8s/` — update `k8s/secret.yaml` with the real `DATABASE_URL` and `k8s/ingress.yaml` with the real hostname before deploying.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
