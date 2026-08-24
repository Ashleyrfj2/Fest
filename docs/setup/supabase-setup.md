# Local Supabase Database Setup Guide

## Overview

FestNest uses Supabase for:
- PostgreSQL application data
- Real-time subscriptions for collaborative features
- Row Level Security (RLS) for data access control
- Authentication and user management
- File storage for photos and receipts

## Browser-branch verification boundary

The browser-reliability branch did not run a Supabase reset or seed at final implementation tips. Its evidence is static/unit/CI, including green Fest Actions Lint run #49. The historical Gate 3 receipt remains historical; a new live browser/repeated/composed run is still outstanding.

## Quick Start

### 1. Start the local project and apply every tracked migration

```bash
npx supabase start
./scripts/demo/reset-demo.sh
npx supabase status
```

`reset-demo.sh` refuses a non-loopback Supabase URL unless an explicit remote-demo override is deliberately supplied. For ordinary development and all thesis work, do not set that override. Never link, reset, seed, or push to a shared/production project from this guide. Use `npx supabase`; do not install the CLI globally with npm.

### 2. Configure local environment variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Read the generated local values from `npx supabase status`:
   - Local API URL → `EXPO_PUBLIC_SUPABASE_URL`
   - Local anon key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Keep the local service-role key only in server-side demo commands; never use an `EXPO_PUBLIC_` name.

3. Your `.env` should look like:
   ```
   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
   ```

### 3. Verify setup

Run this test query in the local Studio SQL Editor at `http://127.0.0.1:54323`:

```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

The reset/seed verifier is the acceptance check. The current migrations create 21 public application tables, including `change_proposals`, plus the private `supply_mutation_audits` authority table. Do not infer migration completeness from an older hard-coded table list.

## Database Schema

### Core Entities (3 tables)
- **users** — App users with ghost account support
- **trips** — Festival trips (root entity)
- **group_members** — User-trip relationship with roles

### Camp Module (2 tables)
- **camp_grids** — Shared campsite dimensions, cell scale, and selected preset
- **camp_items** — Shared placed objects (tents, cars, tables, canopies, fire pits, paths, custom items)

### Supplies & Food (5 tables)
- **supply_items** — Claimable supplies
- **meal_days** — Food calendar days
- **meals** — Individual meals
- **packing_items** — Packing checklist templates
- **packing_checks** — Per-user packed state

### Travel (5 tables)
- **vehicles** — Cars and drivers
- **vehicle_passengers** — Vehicle assignments
- **flight_details** — Flight info
- **outfit_posts** — Outfit photos
- **outfit_votes** — Outfit voting

### Lineup (2 tables)
- **lineup_artists** — Festival lineup
- **artist_votes** — Per-member preferences

### Safety & Activity (3 tables)
- **safety_profiles** — Emergency info (encrypted)
- **activity_logs** — Append-only activity feed
- **budget_entries** — Shared expenses

### Collaboration Governance (1 table)
- **change_proposals** — Proposed shared changes and approval state

### Private Authorization Evidence
- **private.supply_mutation_audits** — Immutable Supply List allow/deny receipts; ordinary authenticated clients have no direct access

## Row Level Security (RLS)

Public application tables use RLS and database functions to enforce trip and role boundaries. The current Supply List workflow is stricter than the original generic policy summary:

### Key Policies

1. **Trip Members Only** — Users can only access data for trips they belong to
2. **Self-Owned Safety** — Users can only manage their own safety profile
3. **Leader Permissions** — Trip leaders can manage members and trip settings
4. **Supply Workflow Authority** — Any member may claim an unassigned item; only its owner may unclaim, pack, or unpack it; only leaders/editors may delete
5. **Append-Only Logs** — Activity logs cannot be updated or deleted, and clients cannot forge the reserved Supply List denial activity

### Helper Functions

- `is_trip_member(trip_id, user_id)` — Check if user is in trip
- `can_edit_trip(trip_id, user_id)` — Check if user can edit (leader or editor)
- `is_trip_leader(trip_id, user_id)` — Check if user is trip leader

## Testing RLS Policies

Use the deterministic tests and local equipment workflow in `testing-database.md`. Do not treat a hand-written SQL impersonation or a successful client response as authorization proof: expected Supply List denial must return `applied=false`, preserve the item, and create the private database audit.

## Storage Buckets (for photos/receipts)

Storage bucket provisioning is not currently tracked by the local thesis reset migrations. This guide does not authorize creating or changing buckets in a remote dashboard. If these product flows enter an approved scope, add reproducible local migrations/policies and verify them before any shared-project change:

1. **outfit-photos** — Outfit post photos
   - Public read access for trip members
   - Upload restricted to authenticated users

2. **receipts** — Budget receipt photos
   - Private access (trip members only)
   - Upload restricted to authenticated users

## Realtime Subscriptions

The tracked migration `20260829000000_enable_supply_realtime.sql` idempotently adds `public.supply_items` to the local realtime publication. Do not run ad hoc publication changes from this guide. Any additional table must be added through a reviewed migration with a deterministic reset and multi-session runtime receipt.

## Troubleshooting

### Can't connect to database
- Run `npx supabase status` and confirm the local services are healthy
- Check that the ignored `.env` uses the current local URL and anon key
- Confirm the application is not pointed at a shared or production project

### RLS blocking queries
- Ensure user is authenticated: `supabase.auth.getUser()`
- Verify user is a member of the trip: check `group_members` table
- Check policies with: `EXPLAIN (ANALYZE) SELECT * FROM table_name;`

### Migrations failing
- Stop and inspect the first failing tracked migration
- Re-run only through `./scripts/demo/reset-demo.sh` after the cause is fixed
- Do not skip migrations, manually patch shared data, or weaken RLS to make reset pass

## Next Steps

1. ✅ Deterministic local reset, synthetic seed, and role verification are tracked.
2. ✅ Supply List realtime and database-authoritative workflow/denial behavior are tracked and verified in focused Gate 1 checks.
3. ✅ Gate 2 and Gate 3 are accepted milestones; the historical Gate 3 receipt was not rerun against the final browser-branch implementation tips.
4. ⬜ Storage bucket provisioning remains outside this tracked local setup until it receives migrations and validation.

## Useful SQL Queries

```sql
-- View all trips and their members
SELECT
  t.name AS trip_name,
  u.display_name,
  gm.role
FROM trips t
JOIN group_members gm ON t.id = gm.trip_id
JOIN users u ON gm.user_id = u.id
ORDER BY t.name, gm.role;

-- Count items by status for a trip
SELECT
  status,
  COUNT(*) as count
FROM supply_items
WHERE trip_id = 'your-trip-id'
GROUP BY status;

-- View camp grid with all items
SELECT
  cg.width_ft,
  cg.height_ft,
  cg.cell_size_ft,
  cg.festival_preset,
  ci.item_type,
  ci.label,
  ci.real_width_ft,
  ci.real_height_ft,
  ci.x,
  ci.y,
  ci.color,
  u.display_name AS assigned_to
FROM camp_grids cg
LEFT JOIN camp_items ci ON cg.trip_id = ci.grid_id
LEFT JOIN users u ON ci.assigned_to = u.id
WHERE cg.trip_id = 'your-trip-id';
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Storage Guide](https://supabase.com/docs/guides/storage)
