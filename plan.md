# Plan: Initial Version of pick-me-a-dinner

## Context
Building the first version of a family dinner-picking web app from scratch. PostgreSQL-backed, Next.js + Prisma stack, deployed to Kubernetes.

---

## Stack
- **Next.js 14** (App Router) with TypeScript
- **Prisma** ORM + **PostgreSQL**
- **Tailwind CSS** for styling
- **Docker** image for Kubernetes deployment

---

## Data Model (Prisma schema)

```
Restaurant  { id, name, createdAt, orderUrl, phoneNumber, notes }
Meal        { id, name, createdAt, notes }          // homecooked meals
Dinner      { id, date (Date), type (RESTAURANT | HOMECOOKED), restaurantId?, mealId?, notes }
```

- A dinner references either a `Restaurant` or a `Meal` (not both)

---

## Pages & Routes

| Route | Purpose |
|---|---|
| `/` | Home: today's slot + last 7 nights + "Pick for me" button |
| `/add?date=YYYY-MM-DD` | Add/edit a dinner for a date — picker for restaurant or meal, with inline create |
| `/history` | Paginated full dinner log |
| `/restaurants` | List + add + delete restaurants |
| `/meals` | List + add + delete homecooked meals |

All data fetching via Next.js **Server Components** + **Server Actions** (no separate API layer needed).

---

## Random Picker Logic

- Fetch all dinners from the last 21 days
- Get all restaurants and meals
- Deprioritize options used in the last 21 days based on how recently they were ordered.
- Pick randomly from the higest priority options.
- Surfaced as a button on the home page that redirects to `/add?date=today&suggested=<id>&type=<type>`

---

## Project Structure

```
/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # optional seed data
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx          # home
│       ├── add/page.tsx
│       ├── history/page.tsx
│       ├── restaurants/page.tsx
│       └── meals/page.tsx
├── Dockerfile
├── docker-compose.yml        # local dev with postgres
└── .env.example
```

---

## Kubernetes Deployment

- **Dockerfile**: multi-stage build (node:20-alpine), runs `prisma migrate deploy && next start`
- App expects `DATABASE_URL` env var
- Kubernetes manifests (in `/k8s/`): `Deployment`, `Service`, `Ingress`, `Secret` (for DATABASE_URL)
- PostgreSQL assumed to be a separate service in the cluster (not managed by this repo)

---

## Implementation Order

1. Init Next.js project with TypeScript + Tailwind + Prisma
2. Define schema, run initial migration
3. Build restaurant and meal management pages (simple CRUD)
4. Build dinner history page
5. Build add-dinner page with picker + inline create
6. Build home page with recent history + random picker
7. Dockerfile + docker-compose for local dev
8. Kubernetes manifests

---

## Verification

- `docker-compose up` starts app + postgres locally
- Seed a few restaurants/meals, add dinners for several past dates
- Verify history shows correct order
- Verify random picker excludes recent options
- `docker build` succeeds; confirm `DATABASE_URL` migration runs on container start
