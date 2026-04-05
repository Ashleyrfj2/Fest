CompleteCom# FestNest — Project Context

## What This Is

FestNest is a mobile app (iOS + Android, React Native) for coordinating camping music festival trips with your group. Think "Splitwise meets Google Docs meets festival survival guide" — one app replaces the 14 group chat threads, shared notes, and spreadsheets your crew currently juggles before Electric Forest.

Target audience: camping festival-goers (Electric Forest, Dancefestopia, Wookan, Beyond Wonderland PNW, Bonnaroo).

## Architecture

- **Framework:** Expo (React Native) + TypeScript
- **Real-time sync:** Supabase
- **Navigation:** Expo Router
- **Maps:** Mapbox or Google Maps SDK
- **Invites:** Deep links (Universal Links / App Links)
- **Storage:** Supabase Storage for photos, receipts
- **Offline:** SQLite on device for camp grid + safety cards
- **Encryption:** E2E for SafetyProfile data
- **Amounts:** Stored as integers (cents) — never floats

## 9 Modules

1. **Camp Grid** (P1, hero feature) — Real-to-scale campsite layout with drag-and-drop. Items use actual measurements. Offline-first. Festival presets auto-load lot dimensions.
2. **Collaboration** (P1) — 3-tier roles: Leader / Editor / Viewer. Invite links, approval queue, activity feed, module-level permissions.
3. **Supply List** (P1) — Claimable items: unassigned → claimed → packed. Duplicate detection. 8 categories.
4. **Food Planner** (P2) — Day-by-day meal calendar. Cook assignment, dietary flags. Ingredients auto-sync to supply list.
5. **Travel** (P1) — Vehicles, passengers, pickup waypoints, flight details, meetup pin. Outfit voting with group theme.
6. **Lineup Scheduler** (P2) — Artist voting (must see / want to see / skip). Conflict detection. Group schedule builder. "Going now" live signal.
7. **Packing Checklist** (P2) — Pre-loaded essentials by category. Per-member independent progress. Group items assigned to one person.
8. **Safety/Emergency** (P1) — Emergency contacts, allergies, meds. Encrypted at rest. Offline-cached on join. Self-owned.
9. **Budget Tracker** (P2) — Shared ledger, equal or custom splits, settle-up summary, receipt photos. Cents as integers.

## Data Model

17 entities — see @docs/product/data-model.md for full schema. Key groups:
- Core: User, Trip, GroupMember
- Camp: CampGrid, CampItem
- Supplies/Food: SupplyItem, MealDay, Meal, PackingItem, PackingCheck
- Travel: Vehicle, VehiclePassenger, FlightDetail, OutfitPost, OutfitVote
- Lineup: LineupArtist, ArtistVote
- Safety/Activity: SafetyProfile, ActivityLog, BudgetEntry

## Key Design Decisions

- Ghost accounts on device — no login wall; email prompted after 5+ min
- 30-second join rule — invite link to inside the group in under 30 seconds
- Notifications never asked on first open — triggered after 2+ module taps
- Camp grid is the hero feature — real-to-scale with actual item dimensions
- Safety profile is soft-prompted, not forced
- Offline-first for camp grid and safety cards
- Activity log is append-only (never update/delete)

## Onboarding

Two paths — see @docs/product/onboarding.md for full flow:
- **Join via invite link:** Tap link → set name/color → see group → soft-prompt safety → soft-prompt notifications
- **Create new trip:** Create trip → set leader profile → share invite → set up first module → assign module leads

## Navigation Architecture

Two-level structure:
- **Level 1 (App Home):** All enrolled festivals, community announcements (admin-curated), app update cards. Bottom nav: Home, Discover, + Create, Activity, Profile.
- **Level 2 (Trip Dashboard):** Per-festival view with module grid, progress, crew activity feed. Entered by tapping a festival card.

## Current Status (March 19, 2026)

- **Complete:** Design specification, 17-entity data model, onboarding flow (both paths), feature ideas, design system (tokens, icons, components)
- **In progress:** Expo project scaffolding, navigation setup, App Home screen
- **Next:** Trip Dashboard (Level 2), Camp Grid screen, Lineup Scheduler, Budget Tracker
- **Aesthetic direction:** Deep indigo-black base (#0E0C16), burnished gold accent (#C9A84C), per-festival color identities (greens for EF, violets for Dancefestopia, pinks for Beyond Wonderland). Warm, premium, not generic.

## Monetization

- Free: 1 active trip, up to 6 members
- Pro: Unlimited trips + members, lineup import tools
- Festival partnerships: Co-branded versions with preloaded lot maps

## Detailed Docs

- @docs/product/data-model.md — Full 17-entity schema with field notes
- @docs/product/design-spec.md — All 9 modules with detailed feature lists and permission matrix
- @docs/product/features.md — Feature ideas: live mode, mesh networking, weather, profiles
- @docs/product/onboarding.md — Both onboarding paths, step by step
- @docs/product/ui-decisions.md — Aesthetic direction, mockup status, design principles

## Notion Project Hub

Full specs live in Notion: https://www.notion.so/322349e899af812c8776d5cd5aa72ed8
Claude Code can access this via the Notion MCP server — see @docs/setup/notion-mcp-setup.md

## Conventions

- Use TypeScript strict for all new files
- Component names in PascalCase
- Amounts always stored as integer cents, never floats
- Offline-critical features (camp grid, safety) must work without network
- All user-facing copy should be warm, casual, and festival-friendly — never corporate
- Use Lucide React for all icons (no emoji as UI icons)
- Use system fonts (SF Pro) with weight hierarchy: 800 headlines, 700 card titles, 600 labels, 400 body
- Use rounded squares for avatars, not circles
- Avoid: generic amber/orange on pure black, emoji icons, generic card grids, DaisyUI defaults
