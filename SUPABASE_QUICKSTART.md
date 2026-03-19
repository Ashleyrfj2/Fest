# Supabase Quick Start - 5 Minute Setup

Follow these steps to set up your FestNest database.

## Step 1: Open Supabase SQL Editor (30 seconds)

1. Go to: https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/sql/new
2. You should see the SQL Editor interface

## Step 2: Run Migration 1 - Initial Schema (2 minutes)

1. **Open the migration file:**
   - In VS Code: `supabase/migrations/20260319000000_initial_schema.sql`

2. **Copy ALL contents** (Command+A, Command+C)

3. **Paste into Supabase SQL Editor** and click **"Run"** (or F5)

4. **Wait for success message:** ✅ "Success. No rows returned"

This creates:
- ✅ 17 database tables
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Auto-update triggers

## Step 3: Run Migration 2 - Security Policies (2 minutes)

1. **Click "New Query"** in Supabase SQL Editor

2. **Open the migration file:**
   - In VS Code: `supabase/migrations/20260319000001_rls_policies.sql`

3. **Copy ALL contents** (Command+A, Command+C)

4. **Paste into Supabase SQL Editor** and click **"Run"**

5. **Wait for success message:** ✅ "Success. No rows returned"

This creates:
- ✅ Row Level Security on all tables
- ✅ Permission policies (leader/editor/viewer)
- ✅ Helper functions for access control

## Step 4: Verify Setup (1 minute)

1. **Click "New Query"** in Supabase SQL Editor

2. **Paste this verification query:**

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

3. **Click "Run"**

4. **Expected output:** You should see 17 tables:
   ```
   activity_logs
   artist_votes
   budget_entries
   camp_grids
   camp_items
   flight_details
   group_members
   lineup_artists
   meal_days
   meals
   outfit_posts
   outfit_votes
   packing_checks
   packing_items
   safety_profiles
   supply_items
   trips
   users
   vehicle_passengers
   vehicles
   ```

## Step 5: Verify RLS is Enabled (30 seconds)

**Run this query:**

```sql
-- Check Row Level Security is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected output:** All tables should show `rowsecurity = true`

---

## ✅ Setup Complete!

Your database is now ready. The app is already configured to connect:
- ✅ Supabase client: `lib/supabase.ts`
- ✅ Environment variables: `.env`
- ✅ TypeScript types: `lib/database.types.ts`

## Next Steps

### Optional: Create Storage Buckets (for photos)

1. Go to: https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/storage/buckets

2. **Create bucket: "outfit-photos"**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

3. **Create bucket: "receipts"**
   - Public: No (private)
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### Optional: Enable Realtime

For collaborative features (live updates when others edit camp grid, etc.):

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE camp_items;
ALTER PUBLICATION supabase_realtime ADD TABLE supply_items;
ALTER PUBLICATION supabase_realtime ADD TABLE artist_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
```

---

## Troubleshooting

### ❌ Error: "relation already exists"
- **Cause:** Tables already created
- **Fix:** Skip to next migration, or drop tables first:
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```

### ❌ Error: "permission denied"
- **Cause:** Not using dashboard SQL Editor
- **Fix:** Use the Supabase dashboard link above (not psql or other tools)

### ❌ Error: "syntax error"
- **Cause:** Didn't copy entire file
- **Fix:** Make sure you copied ALL content from the migration file (scroll to bottom)

---

## Test the Connection

To verify the app can connect to the database:

1. Make sure Expo is running: `npm start`
2. Open the app in browser or simulator
3. Check browser console or terminal for errors
4. No errors = successful connection!

---

## Need Help?

- Full documentation: `docs/supabase-setup.md`
- Data model reference: `docs/data-model.md`
- Supabase docs: https://supabase.com/docs
