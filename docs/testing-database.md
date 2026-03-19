# Testing the Database Connection

Once you've run the Supabase migrations, you can test the database connection using the built-in test page.

## Accessing the Test Page

1. **Make sure migrations are run:**
   - Follow the steps in `SUPABASE_QUICKSTART.md`
   - Or run `./scripts/setup-supabase.sh`

2. **Start the app:**
   ```bash
   npm start
   ```

3. **Open the test page:**
   - In the browser: `http://localhost:8081`
   - Click the **"TEST DB"** button in the top-right corner of the home screen
   - Or navigate directly to: `http://localhost:8081/test-db`

## Using the Test Page

### Test Connection
Click the **"Test Connection"** button to verify:
- ✅ Supabase client is configured correctly
- ✅ Database tables exist
- ✅ RLS policies are working
- ✅ App can query the database

### Create Test Users

Fill in the form:
1. **Display Name** (required) - Any name like "Test User 1"
2. **Avatar Color** - Pick one of 8 colors
3. **Email** (optional) - e.g., `test@example.com`
4. **Phone** (optional) - e.g., `+1 234 567 8900`

Click **"Create User"** to insert into the database.

### Verify Results

After creating users:
- ✅ Success message appears with user ID
- ✅ User appears in "Recent Users" list
- ✅ User data shows: avatar color, name, email, phone, ID

## What This Tests

✅ **Database Connection**
- App can connect to Supabase
- Environment variables are correct
- Network access is working

✅ **Table Creation**
- `users` table exists
- Columns are correct (display_name, avatar_color, email, phone)
- UUID generation works

✅ **Row Level Security**
- RLS policies allow reading all users
- RLS policies allow inserting users
- Auth is configured correctly

✅ **TypeScript Types**
- Database types are correct
- Supabase client is typed
- Autocomplete works

## Verifying in Supabase Dashboard

After creating test users, verify in Supabase:

1. Go to: https://supabase.com/dashboard/project/tumtuhzrgczhkiirdpqt/editor
2. Click **"users"** table in left sidebar
3. You should see all created test users
4. Check that columns match: `id`, `display_name`, `avatar_color`, `email`, `phone`, `created_at`, `last_seen_at`

## Common Issues

### ❌ "Connection failed: relation 'users' does not exist"
- **Cause:** Migrations haven't been run yet
- **Fix:** Run migrations in `SUPABASE_QUICKSTART.md`

### ❌ "Connection failed: invalid JWT"
- **Cause:** Wrong `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- **Fix:** Copy correct key from Supabase dashboard → Settings → API

### ❌ "Connection failed: Failed to fetch"
- **Cause:** Wrong `EXPO_PUBLIC_SUPABASE_URL` in `.env`
- **Fix:** Verify URL is `https://tumtuhzrgczhkiirdpqt.supabase.co`

### ❌ "new row violates row-level security policy"
- **Cause:** RLS policies weren't applied
- **Fix:** Run the RLS migration: `supabase/migrations/20260319000001_rls_policies.sql`

## Next Steps

Once the test page works:

1. ✅ Database connection verified
2. ✅ Ready to build real features
3. ✅ Can start implementing authentication
4. ✅ Can connect real data to App Home screen

## Clean Up Test Data

To delete test users from database:

```sql
-- In Supabase SQL Editor
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Or delete all users
DELETE FROM users;
```

## Removing the Test Page

Once you've verified the connection works, you can remove the test page:

1. Delete `app/test-db.tsx`
2. Remove the "Test DB" button from `app/(tabs)/index.tsx`:
   - Remove the `Link` component from the header
   - Remove the `headerButtons`, `testButton`, and `testButtonText` styles

Or keep it for future testing!
