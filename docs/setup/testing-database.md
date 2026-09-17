# Testing the Local Database

This is the current guarded database-validation path. Use synthetic data and the local Supabase stack only. Never use the shared/production Festival project for reset, seed, authorization, or thesis-demo tests.

## Database Boundaries and Isolation

There are three distinct database targets across the workspace:

1. **Festival Local Supabase Database** (`127.0.0.1:54321` / `54322` / Studio `54323`):
   - Contains Festival application state, auth users, Supabase storage, and realtime configuration.
   - Initialized and seeded via `scripts/demo/reset-demo.sh`.
   - Used for Festival application execution and composed workflow tests.

2. **Demo Persistent QA Database** (`demo_qa_postgres`, `127.0.0.1:54332` / API `8080`):
   - Contains the persistent QA platform evidence ledger, build registrations, and experiment runs.
   - Managed via Demo's `docker compose up` stack.

3. **Isolated / Throwaway PostgreSQL Integration Test Databases**:
   - Ephemeral schemas (`qa_test_<pid>_<nanos>`) created dynamically by Go integration tests (`prepareIntegrationDatabase`).
   - Run in complete isolation on loopback and drop their schemas automatically on test cleanup (`t.Cleanup`).
   - **Strict invariant**: Integration tests must never silently target persistent development databases (`demo_qa_postgres` or Festival Supabase).

## Safety Rules for Database Operations

- **STOP AND VERIFY**: Before running any reset or migration command, verify both the current repository working directory (`pwd`) and the exact database target URL.
- **No Destructive Operations on Persistent Databases**: Never perform broad `DELETE`, `TRUNCATE`, `DROP TABLE`, `supabase db reset`, or volume removals on persistent development databases without explicit authorization and target verification.
- **Loopback Enforcement**: Reset scripts and tests refuse non-loopback database URLs by default.

## Start from a deterministic local state

```bash
npx supabase start
./scripts/demo/reset-demo.sh
npx supabase status
```

The reset script applies every tracked migration in order, seeds the bounded synthetic scenario, and verifies its role matrix and record fingerprint. It refuses non-loopback targets by default. Do not set the remote-reset override for normal development or thesis work.

Use the local values from `npx supabase status` in an ignored `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

Keep the local service-role key server-side only. Never place it in an `EXPO_PUBLIC_` variable, browser bundle, extension, log, screenshot, or committed file.

## Required checks

```bash
npm run lint -- --no-cache
npx tsc --noEmit
npm test
```

For the thesis Supply List path, also run the current local equipment workflow with the required local Demo API/run credentials. The test must prove:

- all members can claim an unassigned item;
- only an item's owner can unclaim, pack, or unpack it;
- only leaders/editors can delete;
- viewer deletion returns an explicit non-applied result and leaves the item intact;
- ordinary authenticated clients cannot forge denial activity or access the private mutation audit;
- the database-owned denial audit normalizes to one deterministic authenticated Demo event.

A passing static check is not a browser, realtime, native, or composed-workflow receipt. Record exact runtime commands and results in the current dated session note.

## Inspect local state

Use local Studio at `http://127.0.0.1:54323`. Keep database port `54322` private. Do not use a remote dashboard as the default testing workflow.

## Cleanup

Restore the deterministic synthetic state with:

```bash
./scripts/demo/reset-demo.sh
```

Do not run ad hoc broad `DELETE` statements. If the reset fails, stop and repair migration/seed integrity instead of weakening RLS or manually editing shared data.
