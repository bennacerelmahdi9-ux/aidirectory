# Architecture

## Overview

AIAtlas is a Next.js App Router application with server components, server actions, and a Prisma/PostgreSQL backend.

## Layers

- `src/app` — routes, pages, API handlers, server actions
- `src/components` — UI components (shadcn/ui based)
- `src/lib` — shared utilities, queries, constants
- `prisma` — schema and seed scripts

## Data flow

- Server components fetch data via `src/lib/queries.ts` using Prisma
- Mutations use server actions in `src/app/actions.ts`
- Auth via NextAuth (JWT strategy, credentials provider)
- Optional Redis caching for categories

## Database

See `prisma/schema.prisma` for models: User, Category, Tool, Review, Bookmark, Report, AIModel, DeveloperResource.
