# FestNest

Mobile app for coordinating camping music festival trips with your group.

## Quick Start

```bash
# Install dependencies
npm install

# Start and rebuild the local Supabase project only
npx supabase start
./scripts/demo/reset-demo.sh

# Start Expo development server
npm start
```

The reset command refuses non-loopback Supabase by default. Never reset, seed, or apply thesis-demo migrations to the shared/production Festival project without explicit approval. Use `npx supabase`; global npm installation is unsupported.

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### Supabase Setup

1. Run `npx supabase status` and use only the generated local URL and keys.
2. Copy `.env.example` to an ignored `.env`; never assume credentials are already configured.
3. Use the tracked migrations in repository order through local reset tooling; do not paste selected historical migrations into a remote dashboard.

See `AGENTS.md` and **docs/setup/supabase-setup.md** for the guarded local-first workflow.

## Project Structure

```
Festival/
├── app/                           # Expo Router pages
│   ├── _layout.tsx               # Root layout
│   └── (tabs)/                   # Tab navigation
│       ├── _layout.tsx           # Tab layout
│       ├── index.tsx             # Home screen
│       ├── discover.tsx          # Discover screen
│       ├── create.tsx            # Create trip screen
│       ├── activity.tsx          # Activity feed
│       └── profile.tsx           # User profile
├── components/                   # Reusable components
│   └── Icon.tsx                  # Icon wrapper for Lucide
├── lib/                          # Utilities and configuration
│   ├── tokens.ts                 # Design system tokens
│   ├── supabase.ts               # Supabase client
│   └── database.types.ts         # TypeScript types for DB
├── supabase/                     # Database migrations
│   └── migrations/
│       ├── 20260319000000_initial_schema.sql
│       └── 20260319000001_rls_policies.sql
├── docs/                         # Project documentation
│   ├── README.md                 # Docs index
│   ├── product/                  # Product specs and system design
│   ├── setup/                    # Setup and infra guides
│   ├── handoffs/                 # Feature handoff docs
│   ├── reports/                  # Implementation reports
│   ├── sessions/                 # Dated session notes
│   └── test-notes.md             # Active QA notes
├── .env                          # Environment variables (Supabase)
├── .env.example                  # Environment template
└── CLAUDE.md                     # Project context for Claude Code
```

## Current Status

Status changes frequently and is tracked in docs rather than this README snapshot:

- `docs/handoffs/feature-handoff-index.md` for current module status and next priorities
- `docs/test-notes.md` for active QA issues and follow-up items
- `docs/sessions/` for dated implementation history

## Tech Stack

- **Frontend:** React Native + Expo + TypeScript (strict mode)
- **Navigation:** Expo Router (file-based, tab-based)
- **Icons:** Lucide React Native (no emoji)
- **Database:** Supabase PostgreSQL with RLS
- **Real-time:** Supabase subscriptions
- **Storage:** Supabase Storage (photos, receipts)
- **Auth:** Supabase Auth with ghost accounts

## Design Principles

- Deep indigo-black base (#0E0C16) with burnished gold accent (#C9A84C)
- No emoji as UI icons — Lucide React only
- Rounded square avatars, not circles
- Warm, festival-friendly copy — never corporate
- Offline-first for camp grid and safety modules
