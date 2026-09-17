# FestNest

FestNest is a React Native + Expo app for coordinating camping music festival trips with a group. It combines campsite planning, shared supplies, travel, schedules, packing, food, budgets, collaboration, and safety information in one mobile app.

## Quick start

Requirements:
- Node.js version from `.nvmrc`
- Docker
- Supabase CLI through `npx supabase`
- Expo-compatible iOS simulator, Android emulator, or device

```bash
nvm install
nvm use
npm ci

npx supabase start
cp .env.example .env
npm start
```

Use the local values printed by `npx supabase status` in your ignored `.env` file. Do not commit local or hosted credentials.

Then:
- Press `i` for the iOS simulator
- Press `a` for the Android emulator
- Or scan the Expo QR code on a supported device

## Local database

FestNest uses Supabase PostgreSQL, Auth, Storage, Realtime, and row-level security.

For a deterministic local setup:

```bash
./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh
```

The reset tooling is intentionally restricted to loopback/local Supabase. Do not point reset or seed commands at a shared or production database.

See `docs/setup/supabase-setup.md` for more detail.

## Project structure

```text
Fest/
├── app/                 Expo Router pages
├── components/          reusable UI components
├── lib/                 application logic, hooks, crypto, Supabase, SQLite
├── supabase/            local config and database migrations
├── scripts/             local development and deterministic demo tooling
├── tests/               deterministic and browser tests
├── docs/                product and setup documentation
└── .env.example         safe environment-variable template
```

## Validation

```bash
npm run workspace:check
npm test
npm run test:browser
npx tsc --noEmit
npm run lint
```

Install Playwright Chromium once per operating system if browser tests require it:

```bash
npx playwright install chromium
```

## Tech stack

- React Native + Expo + TypeScript
- Expo Router
- Supabase PostgreSQL with row-level security
- Supabase Auth, Realtime, and Storage
- SQLite for offline-aware flows
- Playwright for browser-level validation
- Lucide React Native icons

## Security

- Real environment files are ignored by Git.
- Service-role keys, database credentials, provider secrets, and personal access tokens must only be supplied through local/CI environment variables.
- The repository-local Supabase configuration is for local development only.
- `SECRETS_AUDIT.md` documents the public-release secret review.

## Design principles

- Deep indigo-black base with burnished gold accents
- Rounded-square avatars
- Festival-friendly copy
- Offline-aware camp-grid and safety flows
- Shared planning state with role-aware collaboration
