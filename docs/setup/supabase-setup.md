# Supabase Database Setup Guide

## Overview

FestNest uses Supabase for:
- PostgreSQL database with 17 tables
- Real-time subscriptions for collaborative features
- Row Level Security (RLS) for data access control
- Authentication and user management
- File storage for photos and receipts

## Quick Start

### 1. Create Supabase Project

You already have a project at: `db.tumtuhzrgczhkiirdpqt.supabase.co`

### 2. Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/editor
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/migrations/20260319000000_initial_schema.sql`
5. Click "Run" to create all 17 tables
6. Repeat for `supabase/migrations/20260319000001_rls_policies.sql` to add security policies

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref tumtuhzrgczhkiirdpqt

# Run migrations
supabase db push
```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/settings/api
   - Copy your **Project URL** → paste as `EXPO_PUBLIC_SUPABASE_URL`
   - Copy your **anon public** key → paste as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. Your `.env` should look like:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://tumtuhzrgczhkiirdpqt.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Verify Setup

Run this test query in Supabase SQL Editor:

```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all 17 tables:
- activity_logs
- artist_votes
- budget_entries
- camp_grids
- camp_items
- flight_details
- group_members
- lineup_artists
- meal_days
- meals
- outfit_posts
- outfit_votes
- packing_checks
- packing_items
- safety_profiles
- supply_items
- trips
- users
- vehicle_passengers
- vehicles

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

## Row Level Security (RLS)

All tables have RLS enabled with the following rules:

### Key Policies

1. **Trip Members Only** — Users can only access data for trips they belong to
2. **Self-Owned Safety** — Users can only manage their own safety profile
3. **Leader Permissions** — Trip leaders can manage members and trip settings
4. **Editor Permissions** — Editors can modify trip content (supplies, camp, etc.)
5. **Append-Only Logs** — Activity logs cannot be updated or deleted

### Helper Functions

- `is_trip_member(trip_id, user_id)` — Check if user is in trip
- `can_edit_trip(trip_id, user_id)` — Check if user can edit (leader or editor)
- `is_trip_leader(trip_id, user_id)` — Check if user is trip leader

## Testing RLS Policies

```sql
-- Test as a specific user (replace with actual user ID)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Try to read trips (should only see trips you're in)
SELECT * FROM trips;

-- Try to update a trip you're not a leader of (should fail)
UPDATE trips SET name = 'Hacked' WHERE id = 'some-trip-id';
```

## Storage Buckets (for photos/receipts)

Create these storage buckets in Supabase Dashboard → Storage:

1. **outfit-photos** — Outfit post photos
   - Public read access for trip members
   - Upload restricted to authenticated users

2. **receipts** — Budget receipt photos
   - Private access (trip members only)
   - Upload restricted to authenticated users

## Realtime Subscriptions

Enable realtime for collaborative features:

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE camp_grids;
ALTER PUBLICATION supabase_realtime ADD TABLE camp_items;
ALTER PUBLICATION supabase_realtime ADD TABLE supply_items;
ALTER PUBLICATION supabase_realtime ADD TABLE artist_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
```

Current app behavior:
- The camp grid screen loads the newer of the local SQLite snapshot or the shared Supabase snapshot
- `Save Layout` publishes the current local camp layout into `camp_grids` and `camp_items`
- The client does not yet subscribe to live realtime updates for camp layouts, so group changes appear on the next reload/open rather than instantly

## Troubleshooting

### Can't connect to database
- Check that your `.env` file has correct credentials
- Verify your Supabase project is active
- Check that you're not hitting rate limits

### RLS blocking queries
- Ensure user is authenticated: `supabase.auth.getUser()`
- Verify user is a member of the trip: check `group_members` table
- Check policies with: `EXPLAIN (ANALYZE) SELECT * FROM table_name;`

### Migrations failing
- Run migrations in order (schema first, then RLS)
- Check for syntax errors in SQL files
- Verify UUID extension is enabled

## Next Steps

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ⬜ Create storage buckets for photos
4. ⬜ Enable realtime subscriptions
5. ⬜ Test with sample data
6. ⬜ Set up authentication flow in app

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
