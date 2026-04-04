# FestNest

Mobile app for coordinating camping music festival trips with your group.

## Quick Start

```bash
# Install dependencies
npm install

# Set up Supabase database (first time only)
# See docs/setup/supabase-setup.md for detailed instructions

# Start Expo development server
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### Supabase Setup

1. Run the database migrations in your Supabase project:
   - Go to https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/editor
   - Copy contents of `supabase/migrations/20260319000000_initial_schema.sql` and run
   - Copy contents of `supabase/migrations/20260319000001_rls_policies.sql` and run

2. Environment variables are already configured in `.env`

See **docs/setup/supabase-setup.md** for complete setup guide.

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
│   ├── data-model.md             # 17-entity schema
│   ├── design-spec.md            # Module specifications
│   ├── onboarding.md             # Onboarding flows
│   ├── ui-decisions.md           # Design direction
│   └── supabase-setup.md         # Database setup guide
├── .env                          # Environment variables (Supabase)
├── .env.example                  # Environment template
└── CLAUDE.md                     # Project context for Claude Code
```

## Current Status

✅ **Complete**
- Expo project scaffolded with TypeScript and Expo Router
- Design system tokens defined (colors, typography, spacing)
- App Home screen (Level 1) with tab navigation
- 3 festival cards, 3 community posts, 3 app update cards
- Supabase database schema (17 tables)
- Row Level Security (RLS) policies
- Supabase client configured
- TypeScript types for database

🚧 **In Progress**
- Database migrations (ready to run)
- Environment configuration

📋 **Next Steps**
1. Run Supabase migrations to create tables
2. Build Trip Dashboard (Level 2) screen
3. Implement authentication flow
4. Connect real data to App Home screen
5. Build Camp Grid module with drag-and-drop
6. Add Lineup Scheduler with voting
7. Build Budget Tracker with settle-up view

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
