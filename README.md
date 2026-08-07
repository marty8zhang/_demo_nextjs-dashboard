# Egghdz Demo - Next.js Dashboard

<!-- TOC -->
* [Egghdz Demo - Next.js Dashboard](#egghdz-demo---nextjs-dashboard)
  * [Preparation](#preparation)
  * [Run](#run)
  * [Lint](#lint)
  * [Build](#build)
  * [Reference](#reference)
<!-- TOC -->

## Preparation

1. Copy `.env.example` as `.env` and fill in the missing values.
2. Run `pnpm install`.
3. Run `pnpm dev`.
4. Run `docker compose up -d`.
5. Go to http://localhost:3000/seed to seed the database.
6. Check `app/lib/placeholder-data.ts` for login email and password.

## Run

```shell
docker compose up -d
```

```shell
pnpm dev
```

## Lint

```shell
pnpm lint
```

## Build

**Note:** Next.js tries to statically generate any route it safely can during `next build` with a mechanism called SSG (Static Site Generation). SSG works by rendering a page to plain HTML once (at build, on a schedule, or on-demand) and then serving that same file to every visitor instead of re-running the DB query and render on each request. If a Server Component queries the database while rendering, that query will need to be run at build time - so an unreachable DB causes the build to fail; Client Components don't trigger this, since their data fetching happens later, in the browser. Routes using `cookies()`, `headers()`, or similar request-specific APIs, and routes marked `force-dynamic`, are excluded from static generation.

1. `docker compose up -d`
2. `pnpm dev`
3. Go to http://localhost:3000/seed to seed the database.
4. `pnpm build`

## Reference

https://nextjs.org/learn/dashboard-app
