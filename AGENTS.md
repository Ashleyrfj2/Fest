# Riley Agent Operating Guide — Festival / FestNest

This file is required reading at the start of every agent task in the Festival repository.

## Start every task here

1. Read this file completely.
2. Inspect `git status --short` and preserve all existing user changes.
3. Read `README.md`, `docs/thesis-demo/festival-virtual-qa-environment.md`, `docs/product/feature-completion.md`, `docs/test-notes.md`, relevant handoffs/reports, and migrations for the area being changed.
4. Treat `CLAUDE.md` as product background, not authoritative current status; its progress snapshot is older than the current implementation.
5. Confirm whether the task is product work, thesis-demo environment work, or both.
6. Use local/synthetic data for demo work. Never reset or seed the remote Festival project without explicit approval.
7. The private Notion page is optional context, not a dependency. Its implementation requirements are mirrored in `docs/thesis-demo/festival-virtual-qa-environment.md`. When the task affects the thesis demo and the agent is connected and authorized to Ashley's Notion, read the tutorial:
   - https://app.notion.com/p/3c4ec84d128b811b877dc262fec351d8
   If Notion is unavailable, continue from the tracked guide and sibling thesis `AGENTS.md` without blocking. Do not require Ashley's local files or private Notion pages.
8. Also read the sibling thesis repository's `AGENTS.md` when that checkout is available. Resolve it dynamically; never assume Ashley's local paths exist.

## Portable repository paths

Never encode `/Users/ashley/...` paths in code, scripts, configuration, or agent instructions.

The GitHub repositories are:

```text
Festival  https://github.com/Ashleyrfj2/Fest
Thesis    https://github.com/Ashleyrfj2/Demo
```

Resolve roots dynamically:

```bash
export FESTIVAL_REPO_ROOT="$(git rev-parse --show-toplevel)"
export WORKSPACES_ROOT="$(dirname "$FESTIVAL_REPO_ROOT")"
export THESIS_REPO_ROOT="$WORKSPACES_ROOT/Demo"
```

In a Codespace created from `Fest`, the expected paths are:

```text
/workspaces/Fest   Festival repository
/workspaces/Demo   thesis sibling clone
```

On any other computer, the parent directory may differ. Use repository-relative paths or these variables.

## GitHub Codespaces setup

The tracked `.devcontainer/devcontainer.json` requests access to `Ashleyrfj2/Demo`. Riley must already be a collaborator on both repositories and must authorize the requested permission when creating a new Codespace.

### Create from Festival

1. Open `https://github.com/Ashleyrfj2/Fest`.
2. Select **Code → Codespaces → New with options**.
3. Choose the branch containing this guide and the dev-container configuration.
4. Select at least 4 cores / 8 GB RAM.
5. Review and authorize access to `Ashleyrfj2/Demo`.
6. Create the Codespace.

### Clone the sibling thesis repository

```bash
cd /workspaces
test -d Demo || gh repo clone Ashleyrfj2/Demo Demo
cd /workspaces/Demo
git status --short
```

If the clone fails, verify Riley has repository access. Repository permissions added to `devcontainer.json` affect only new Codespaces after the configuration is committed. For an older Codespace, create a new one or use a narrowly scoped fine-grained token stored as a Codespaces secret.

### Bootstrap both repositories

```bash
export FESTIVAL_REPO_ROOT=/workspaces/Fest
export THESIS_REPO_ROOT=/workspaces/Demo

cd "$FESTIVAL_REPO_ROOT" && npm install
cd "$THESIS_REPO_ROOT/frontend" && npm install
cd "$THESIS_REPO_ROOT/extension" && npm install

cd "$FESTIVAL_REPO_ROOT"
npx supabase start
npx supabase status
npx supabase db reset
```

Codespaces uses Node 20+, so invoke Supabase through `npx`. For a pinned team version, add `supabase` as a development dependency. Never install it globally with npm. Use local Supabase values by default. If a shared remote credential is explicitly approved, store it in GitHub Codespaces secrets with access limited to the required repository. Never commit it. Keep forwarded ports private unless a task explicitly requires a shared preview.

Open or forward these ports from the Codespaces **Ports** panel:

```text
4173  Festival browser environment
5173  thesis evidence UI
8080  thesis API
54323  local Supabase Studio
54324  local email inbox
```

Official references:

- GitHub Codespaces additional repository access: https://docs.github.com/en/codespaces/managing-your-codespaces/managing-repository-access-for-your-codespaces
- GitHub Codespaces secrets: https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces
- Supabase CLI installation and local development: https://supabase.com/docs/guides/local-development/cli/getting-started

## Project description

FestNest is an Expo SDK 55 React Native/TypeScript application for coordinating group camping-festival trips. It combines shared trip planning, role-aware collaboration, realtime Supabase state, and offline-critical SQLite paths.

Core modules:

1. Camp Grid
2. Collaboration and permissions
3. Supply List
4. Food Planner
5. Travel
6. Lineup Scheduler
7. Packing Checklist
8. Safety/Emergency
9. Budget Tracker

The active product wedge is collaborative real-dimension camp setup, equipment ownership, and offline festival coordination. Do not assume every planned feature is implemented; verify current code and runtime.

## Repository map

```text
app/                         Expo Router screens and navigation
components/                  Shared and module UI
lib/auth/                    Supabase Auth/session behavior
lib/hooks/                   Supabase-backed product workflows
lib/sqlite/                  Offline/local persistence
lib/crypto/                  Safety encryption
lib/*.ts                     Domain types and pure utilities
scripts/                     Export, setup, and verification tools
supabase/config.toml         Local Supabase configuration
supabase/migrations/         Schema, RLS, auth, and security migrations
tests/                       Deterministic TypeScript tests
tests/browser/               Playwright browser tests and fixtures
docs/product/                Product and feature documentation
docs/handoffs/               Current implementation handoffs
docs/reports/                QA and revalidation reports
docs/test-notes.md           Active QA notes
```

Source code, current migrations, recent handoffs, tests, and QA notes override older status summaries.

## Technical conventions

- TypeScript strict mode.
- Expo Router file-based navigation.
- Supabase Auth/PostgreSQL/RLS/realtime for shared state.
- SQLite/Secure Store for offline-critical or sensitive local paths.
- Amounts are integer cents, never floating-point currency.
- Lucide icons, not emoji UI icons.
- Warm, festival-friendly copy; avoid generic corporate language.
- Rounded-square avatars.
- Preserve fail-closed behavior for authorization, remote-load failures, and destructive saves.
- Do not expose service-role keys in client code.

## Supabase walkthrough

### Local development — default

```bash
cd "$FESTIVAL_REPO_ROOT"
supabase start
supabase status
supabase db reset
```

Local ports:

```text
54321  API
54322  PostgreSQL
54323  Studio
54324  email inbox
```

Use the local values printed by `supabase status`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
```

Rules:

- `supabase db reset` is allowed only for the local/disposable environment in scope.
- Never run destructive database commands against a shared or production project without explicit approval.
- The service-role key is server/admin only and must never use an `EXPO_PUBLIC_` prefix.
- Never commit `.env` or `.env.local`.
- Apply migrations in order and verify RLS after policy changes.
- Do not weaken security controls to make a demo or test pass.

### Remote access

Riley should be invited through Supabase with the minimum necessary role. Use a password manager or approved secret vault for any credential that cannot be obtained through project membership. Never paste service-role keys into GitHub, Notion, Slack, email, issues, screenshots, or agent prompts.

## Ignored files and collaborator access

Ignored files are recreated rather than copied:

| Ignored item | Riley recreates it with |
| --- | --- |
| `node_modules/` | `npm install` |
| `.expo/`, `dist/`, `web-build/` | Expo/build commands |
| `supabase/.temp/` | `supabase start` or `supabase link` |
| `.env`, `.env.local` | Copy `.env.example` and fill local values |
| demo database | Committed reset/seed scripts |
| generated demo manifest | Demo reset command |
| `.claude/settings*.json` | Personal configuration; do not share |

Never force-add `.env`. Track sanitized examples, migrations, seed/reset scripts, scenario files, lockfiles, and setup documentation.

GitHub repository secrets are for CI/deployment and do not populate a developer's local environment.

## QA thesis demo role

Festival is the controlled target environment and an evidence source. The sibling `Ashleyrfj2/Demo` repository at `THESIS_REPO_ROOT` owns normalized evidence, reconciliation, sufficiency, corrections, routing, recommendations, and metrics.

Festival must not become coupled to thesis sufficiency or routing logic.

### V1 scenario

Use only the shared group-equipment handoff:

1. Leader creates a canopy supply item.
2. Editor A claims it.
3. Another tester independently verifies it.
4. Editor A marks it packed during a controlled stale/offline condition.
5. Viewer attempts a restricted mutation.
6. Shared state reconciles.
7. A Playwright agent checks another context.
8. A late tester is directed to the highest-value unresolved uncertainty.

Fixed identifiers:

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
```

Do not use Safety/Emergency data in V1.

### Expected demo files

```text
scripts/demo/seed-demo.mjs
scripts/demo/reset-demo.sh
scripts/demo/verify-seed.mjs
scripts/demo/activity-log-adapter.mjs
tests/demo/equipment-handoff.spec.ts
demo/scenarios/equipment-handoff-v1.json
demo/.generated/manifest.json      # ignored
```

Seed/reset tooling must refuse non-loopback Supabase URLs by default, create only synthetic identities/data, verify the role matrix and record counts, and produce an ignored manifest of generated IDs.

### Browser environment

The browser export must allow caller-provided local Supabase variables. Never replace them with the production project implicitly.

Expected local URL:

```text
http://127.0.0.1:4173
```

The current Playwright fixture is useful smoke-test infrastructure but is per-page and largely canned. Use local Supabase for shared multi-user thesis state.

### Festival evidence adapter

Festival `activity_logs` are source evidence, not the final thesis model. The adapter must:

- Map Festival action types to the common `ValidationEvent` vocabulary.
- Include actor, role, build, environment, route, target, source, and time.
- Derive deterministic candidate fingerprints.
- Use deterministic event IDs and a cursor to prevent duplicates.
- Exclude unreviewed user-entered descriptions.
- Never decide thesis sufficiency or routing inside Festival.

## Port coordination with the thesis repository

Festival local Supabase owns host database port `54322`. The thesis PostgreSQL service must map to host port `54332`. Do not change Festival's port during an experiment; update the thesis mapping instead.

Other expected ports:

```text
4173  Festival browser environment
5173  thesis evidence UI
8080  thesis API
```

## Validation commands

```bash
cd "$FESTIVAL_REPO_ROOT"
npm install
npm run lint -- --no-cache
npx tsc --noEmit
npm test
npm run test:browser
```

For local Supabase changes:

```bash
supabase start
supabase db reset
supabase status
```

Validation rules:

- Static checks do not prove browser, iOS, Android, realtime, offline, or multi-user runtime behavior.
- Run the affected runtime whenever practical.
- Verify RLS at the database boundary, not only through hidden UI controls.
- Validate online/offline transitions for offline-critical changes.
- Preserve and test fail-closed behavior.

## Privacy and security

- Use synthetic accounts and data for thesis work.
- Never include production customer data.
- Never capture passwords, auth tokens, cookies, raw sensitive bodies, or Safety/Emergency content.
- Never expose the service-role key in Expo, browser code, extensions, logs, or reports.
- A viewer mutation that succeeds is a security failure; stop and investigate.
- Do not bypass RLS or authorization for convenience.
- Controlled seeded conditions must be demo-only, build-scoped, reversible, and disclosed as experimental during debrief.

## Definition of done

A Festival change is complete only when:

- The current worktree and user changes were preserved.
- Relevant lint, type checks, tests, and runtime checks pass.
- Database changes have migrations and RLS verification.
- Offline/realtime behavior is tested when affected.
- Secrets and generated artifacts remain ignored.
- Documentation states verified current behavior and remaining limits.
- The thesis adapter boundary remains vendor-neutral.
- The final handoff names changed files, checks run, results, and unresolved risks.
