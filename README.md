# FestNest

Mobile app for coordinating camping music festival trips with your group. Festival also serves as the controlled source application for the Demo QA-platform thesis MVP.

## Quick Start

```bash
nvm install
nvm use
npm ci

./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh

npm start
```

The reset command refuses non-loopback Supabase by default. Never reset, seed, or apply thesis-demo migrations to a shared/production Festival project without explicit approval. Use `npx supabase`; global npm installation is unsupported.

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go

## Riley Windows / WSL setup

Riley should use **WSL2 with native Linux clones**, not a clone under `/mnt/c` or another Windows-mounted path.

Canonical Festival-side setup:

```text
docs/setup/cross-platform-workspace.md
```

That guide covers WSL2, Docker Desktop WSL integration, private GitHub authentication inside WSL, exact Node/npm versions, cloning both repos, Playwright, local Supabase, `.env`, port ownership, and agent preflight.

Expected clone paths:

```text
~/repos/Demo
~/repos/Fest
```

Open the repository with `code .` from the WSL shell so Git, Node, npm, Bash, Docker, Supabase, and Playwright all operate in the Linux environment.

Never share `node_modules`, Playwright caches, `.env` files, Docker volumes, or Supabase state between Ashley's Mac and Riley's WSL machine.

## Supabase Setup

1. Run `npx supabase status` and use only the generated local URL and keys.
2. Copy `.env.example` to an ignored `.env`; never assume credentials are already configured.
3. Use tracked migrations in repository order through local reset tooling; do not paste selected historical migrations into a remote dashboard.

See `AGENTS.md` and `docs/setup/supabase-setup.md` for the guarded local-first workflow.

## Project Structure

```text
Festival/
├── app/                 Expo Router pages
├── components/          reusable components
├── lib/                 utilities, Supabase, generated types
├── supabase/            migrations/config
├── scripts/             local/demo/browser tooling
├── tests/               deterministic and browser tests
├── docs/                product/setup/handoff/report/session docs
├── .env.example         local environment template
├── AGENTS.md            agent operating guide
└── CLAUDE.md            Claude Code context
```

## Current Thesis-Demo Status — August 27, 2026

```text
Gate 1   PASS
Gate 2   PASS
Gate 3   PASS — fresh exact-tip runtime receipt Aug 27
M4A      PASS
M4B      PASS
M4C      PASS
M4D      PASS
M5A      PASS — merged in Demo
M5B      PASS — merged in Demo (#20)
Live M5B PASS — override/retry/restart/frozen proof Aug 27
M6       PASS — deeper heterogeneous Playwright/backend verifier, Demo PR #23
NEXT     M7 accelerator-demo recording
```

M6 proves a real Festival action can create a shallow human observation, then an independent Playwright reload + authoritative Supabase backend verifier can add deeper evidence to the same Demo ledger, moving the controlled claim from **Weak** to **Solid**. Failed deeper verification submits no stronger observation; a controlled contradiction derives **Conflicted**.

Native WSL composed-runtime proof remains unverified until Riley executes it on his own machine.

Current status details:

- `docs/QA_PLATFORM_INTEGRATION.md`
- `docs/thesis-demo/festival-virtual-qa-environment.md`
- `docs/handoffs/feature-handoff-index.md`
- sibling Demo `docs/agent-logs/CURRENT.md`

Dated session notes and reports are historical point-in-time receipts and should not be rewritten as current status.

## QA Platform Integration

Festival is the rendered target/evidence environment. Demo owns claim identity, evidence contexts, observation linkage, reconciliation, routing, recommendation feedback, and experiment metrics.

Browser export:

```bash
npm run browser:serve
```

Browser target:

```text
http://127.0.0.1:4173
```

Controlled route:

```text
/trips/10000000-0000-4000-8000-000000000001/camp-grid
```

Festival local Supabase remains separate from Demo:

```text
54321  Festival Supabase API
54322  Festival PostgreSQL
54323  Supabase Studio
54324  local inbox
54332  Demo PostgreSQL — not Festival-owned
```

Never copy Supabase URLs, keys, JWTs, migrations, reset commands, database credentials, Docker volumes, or database state between Festival and Demo.

## Browser / Workspace Validation

```bash
npm run workspace:check
npm test
npm run test:browser
```

Install Chromium once per OS:

```bash
# macOS
npx playwright install chromium

# WSL
npx playwright install --with-deps chromium
```

Festival's current declared baseline is **49/49 deterministic tests**, **5/5 browser tests**, TypeScript PASS, and lint 0 errors with 3 pre-existing warnings.

## Tech Stack

- **Frontend:** React Native + Expo + TypeScript
- **Navigation:** Expo Router
- **Icons:** Lucide React Native
- **Database:** Supabase PostgreSQL with RLS
- **Realtime:** Supabase subscriptions
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth with synthetic/ghost demo accounts

## Design Principles

- Deep indigo-black base with burnished gold accent
- No emoji as UI icons — Lucide React only
- Rounded square avatars, not circles
- Warm, festival-friendly copy
- Offline-aware behavior for camp grid and safety modules
