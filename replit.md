# Tennis Ranya

سیستەمی بەڕێوەبردنی تێنیس مێز بۆ کوردستان — A full-stack Kurdish Sorani table tennis management system for Kurdistan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/tennis-ranya run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Tailwind CSS + wouter (routing)
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/` — Express backend
  - `src/routes/` — auth, courts, sessions, expenses, users, reports, settings
  - `src/middlewares/auth.ts` — requireAuth / requireAdmin middleware
- `artifacts/tennis-ranya/src/` — React frontend
  - `pages/` — LoginPage, DashboardPage, TimesPage, CourtsPage, ReportsPage, ExpensesPage, UsersPage, SettingsPage
  - `contexts/UserContext.tsx` — auth context (user state + logout)
  - `components/Layout.tsx` — RTL sidebar layout
- `lib/db/` — Drizzle ORM schema (courts, sessions, users, expenses, settings tables)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/` — generated Zod schemas
- `lib/api-client-react/` — generated React Query hooks

## Architecture decisions

- **RTL layout throughout**: `dir="rtl"` on `<html>`, all text is Kurdish Sorani
- **Contract-first API**: OpenAPI spec drives codegen for both frontend hooks and backend validation schemas
- **Role-based access**: admin role sees courts/users/settings management; cashier only sees courts dashboard, times, reports, expenses
- **Session-based auth**: express-session with httpOnly cookies; no JWT
- **Timer is client-side**: court timers tick in the browser using `startedAt` from the server; no server-side polling needed

## Product

- **Login**: role selector (admin / cashier), username + password
- **Dashboard**: grid of 12 courts, start/stop timers, live cost display, daily income stats
- **Times**: preset-time session starter (15 / 30 / 60 minutes)
- **Courts management** (admin): add/edit/delete courts and hourly rates
- **Reports**: date-range income/expense/profit summary with session history
- **Expenses**: add/delete expenses by category
- **Users** (admin): add/edit/delete users with role assignment
- **Settings** (admin): system name, theme color, Telegram/Discord webhook config

## Credentials (dev)

- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Restart the API server workflow after changing backend routes (it builds before starting)
- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec
- Run `pnpm --filter @workspace/db run push` after changing the DB schema in `lib/db/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
