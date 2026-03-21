# pick-me-a-dinner

A family dinner tracker that helps you decide what to eat tonight. Tracks past dinners, manages a list of restaurants and homecooked meals, and picks a suggestion based on what you haven't had recently.

## Features

- **Tonight's dinner** — view or set what's for dinner, with a history of prior meals
- **Pick for me** — randomly suggests a restaurant or meal, weighted toward options not used recently
- **Tags** — label restaurants and meals to avoid repetition across similar options; tag multiple restaurants with `thai` to avoid the same cuisine ordered recently, or tag with `fried-rice` to avoid getting fried rice from both a Chinese and a Vietnamese restaurant
- **Restaurants** — manage a list of restaurants with order URLs, phone numbers, notes, and tags
- **Homecooked meals** — manage a list of meals you make at home, with tags
- **Full history** — paginated history of all past dinners
- **Calendar view** — browse what was ordered each month

## Stack

- Next.js 16 (App Router, TypeScript)
- Prisma 7 + PostgreSQL
- Tailwind CSS 4

## Development

Requires Node.js and a PostgreSQL database. Set `DATABASE_URL` in your environment.

```bash
npm install
npm run dev        # start dev server at localhost:3000
npm run build      # production build
```

### With Docker

Runs the app and a PostgreSQL instance together:

```bash
docker-compose up
```

### Database

```bash
npm run db:migrate    # create and apply a new migration
npm run db:generate   # regenerate Prisma client after schema changes
```

## Deployment

The included Dockerfile does a multi-stage build on `node:20-alpine` and runs `prisma migrate deploy` before starting the server.

Kubernetes manifests are in `k8s/`. Before deploying, update:
- `k8s/secret.yaml` — set `DATABASE_URL`
- `k8s/ingress.yaml` — set the hostname
