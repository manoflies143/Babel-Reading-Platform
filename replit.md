# Babel Reading Platform

A responsive novel and light novel reading platform with discovery, personal library views, publisher tools, reader preferences, and novel details.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/babel-reading-platform/src/App.tsx` — routed application shell, local placeholder content, and client-side interactions
- `artifacts/babel-reading-platform/src/index.css` — Babel theme tokens, typography, responsive layout, and interaction styling
- `artifacts/babel-reading-platform/package.json` — web app scripts and dependencies
- `artifacts/babel-reading-platform/.replit-artifact/artifact.toml` — managed web workflow and root preview routing

## Architecture decisions

- The first release is frontend-only with local state and minimal illustrative content; backend persistence can be added after the reading and publishing workflows are validated.
- Wouter handles the app routes so the full surface remains lightweight and works under the root artifact path.
- Theme and reading preferences are owned by Settings, keeping the main reading navigation focused.
- The publisher area is deliberately a structured UI shell; PDF import and file processing are placeholders until the publishing model is defined.

## Product

- Home provides a featured reading entry point and intentional empty states for a new library.
- Discover supports client-side search and genre filtering.
- Library separates favorites, reading history, continue reading, and bookmarks with empty states.
- Publisher desk includes add-novel metadata, manuscript, cover/PDF placeholders, and chapter management surfaces.
- Settings includes day/night theme selection, font sizing, text spacing, reading toggles, and account placeholders.
- Novel detail and chapter reader views are wired for the sample story and ready for manually added content.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
