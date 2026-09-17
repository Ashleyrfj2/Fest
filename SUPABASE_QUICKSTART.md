# Supabase quick start

FestNest is configured to run against a local Supabase stack for development and testing.

## 1. Start Supabase

```bash
npx supabase start
```

Use the local URL and keys printed by:

```bash
npx supabase status
```

## 2. Configure local environment variables

Copy the tracked example file:

```bash
cp .env.example .env
```

Populate `.env` only with values from your local Supabase instance unless you intentionally maintain your own hosted project.

Never commit:
- Supabase access tokens
- Service-role keys
- Database passwords or connection strings containing credentials
- OAuth/provider secrets
- CI or personal access tokens

## 3. Apply the database schema

For the repository's deterministic local setup, use:

```bash
./scripts/demo/reset-demo.sh
```

The reset tooling refuses non-loopback Supabase targets by default.

You can also use normal Supabase migration commands against a local development stack.

## 4. Run the app

```bash
npm start
```

Then open the project in an iOS simulator, Android emulator, or supported Expo client.

## Storage and Realtime

The tracked migrations and local configuration define the application's database behavior. If you create your own hosted Supabase project, apply the repository migrations there and configure Storage/Realtime according to your deployment needs.

Do not hardcode a hosted Supabase project ID or dashboard URL into tracked documentation.

## Troubleshooting

Check local services:

```bash
npx supabase status
```

If the local schema is out of sync, stop the app and run the deterministic local reset again.

See `docs/setup/supabase-setup.md` for additional setup notes.
