# AIAtlas

AIAtlas is an open-source directory and discovery platform for AI tools, models, APIs, agents, and developer resources.

## Features

- Searchable directory of AI tools across 15 categories
- Advanced filtering (category, pricing, free, open-source) and sorting
- Side-by-side tool comparison
- AI models directory (OpenAI, Anthropic, Google, Meta, Qwen, DeepSeek, Mistral, ...)
- Developer resources (APIs, SDKs, repos, datasets, docs, tutorials)
- Community accounts, submissions, reviews, bookmarks, reports
- Admin dashboard with moderation, analytics, featured listings
- SEO: dynamic metadata, sitemap, robots.txt
- Light/dark mode, responsive UI

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma ORM
- NextAuth (credentials)
- Redis (optional caching)
- Docker Compose

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL/Redis) or your own instances

### Setup

```bash
cp .env.example .env
# edit .env as needed
docker compose up -d db redis
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Visit http://localhost:3000

### Admin access

After seeding, create an admin user manually or promote one via the database. Example:

```bash
npx tsx scripts/make-admin.ts
```

(Default admin: admin@aiatlas.dev / password123 — change in production.)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — lint
- `npm test` — run tests
- `npm run db:push` — sync schema
- `npm run db:seed` — seed data
- `npm run db:studio` — Prisma Studio

## Docker

```bash
docker compose up --build
```

## Project structure

See `docs/ARCHITECTURE.md`.

## Contributing

See `CONTRIBUTING.md`.

## License

MIT — see `LICENSE`.
