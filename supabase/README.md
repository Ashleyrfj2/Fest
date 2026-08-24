# Local Supabase development

Festival's controlled demo uses a machine-local Supabase stack. Normal setup must
never log in to Supabase, link a hosted project, use the hosted SQL editor, or
push migrations remotely.

From the repository root:

```bash
nvm install
nvm use
npm ci
./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh
```

`start-local-supabase.sh` starts this checkout's local services.
`reset-demo.sh` resets only the local Supabase database, applies the tracked
migrations, seeds the synthetic Festival fixture, and verifies it.

Before any reset, confirm `npx supabase status` reports loopback addresses. Keep
Festival Supabase (`54321`/`54322`) separate from Demo PostgreSQL (`54332`).

Hosted-project work is outside this private-demo workflow and requires a separate,
explicitly approved release procedure.
