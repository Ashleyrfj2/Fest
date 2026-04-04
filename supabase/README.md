# Supabase Database Migrations

## Quick Setup

### 1. Run Migrations in Supabase Dashboard

Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/sql/new) and run these migrations in order:

#### Migration 1: Initial Schema (17 Tables)

```bash
# Copy and paste contents of:
migrations/20260319000000_initial_schema.sql
```

This creates:
- ✅ 17 tables (users, trips, camp_grids, supply_items, etc.)
- ✅ All foreign key relationships
- ✅ Indexes for performance
- ✅ Triggers for `updated_at` timestamps
- ✅ Helper function `log_activity()`

#### Migration 2: Row Level Security

```bash
# Copy and paste contents of:
migrations/20260319000001_rls_policies.sql
```

This adds:
- ✅ RLS policies for all 17 tables
- ✅ Helper functions: `is_trip_member()`, `can_edit_trip()`, `is_trip_leader()`
- ✅ Security: users can only access trips they belong to

### 2. Verify Tables Exist

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output: 17 tables listed alphabetically.

### 3. Test RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

## Troubleshooting

### "relation already exists" error
- Tables already created - skip to next migration
- Or drop and recreate: `DROP TABLE IF EXISTS table_name CASCADE;`

### "permission denied" error
- Make sure you're using the SQL Editor (not the database URL)
- Supabase dashboard automatically uses service role

### Foreign key constraint violations
- Run migrations in order (schema first, then RLS)
- Check that UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

## Database Schema Overview

```
Core (3 tables)
├── users
├── trips
└── group_members

Camp (2 tables)
├── camp_grids
└── camp_items

Supplies & Food (5 tables)
├── supply_items
├── meal_days
├── meals
├── packing_items
└── packing_checks

Travel (5 tables)
├── vehicles
├── vehicle_passengers
├── flight_details
├── outfit_posts
└── outfit_votes

Lineup (2 tables)
├── lineup_artists
└── artist_votes

Safety & Activity (3 tables)
├── safety_profiles
├── activity_logs
└── budget_entries
```

## Next Steps

After migrations are complete:

1. ✅ Create storage buckets for photos (optional)
2. ✅ Enable realtime subscriptions (optional)
3. ✅ Test with sample data
4. ✅ Connect app to database

See [docs/setup/supabase-setup.md](../docs/setup/supabase-setup.md) for full documentation.
