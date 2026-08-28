# macOS and native-WSL workspace contract

Ashley and Riley should run the same tracked code with machine-local dependencies and machine-local data.

For Riley, the supported Windows workflow is **WSL2 + a native Linux checkout**. Do not use a Windows-mounted checkout as the active development workspace.

## Windows / WSL prerequisites for Riley

Before an agent installs project dependencies, Riley should verify:

1. WSL2 is installed and the chosen distro is version 2:

   ```powershell
   wsl --status
   wsl -l -v
   ```

2. Docker Desktop is running with the WSL2 engine and integration enabled for Riley's distro. Inside WSL:

   ```bash
   docker version
   docker compose version
   ```

3. Base Linux tooling is present:

   ```bash
   sudo apt update
   sudo apt install -y build-essential ca-certificates curl gh git make
   ```

4. GitHub authentication works **inside WSL** for both private repositories:

   ```bash
   gh auth login --hostname github.com --git-protocol https --web
   gh auth setup-git
   gh auth status
   git ls-remote https://github.com/Ashleyrfj2/Fest.git HEAD
   git ls-remote https://github.com/Ashleyrfj2/Demo.git HEAD
   ```

   Complete browser/device authorization as Riley. `gh auth setup-git` binds HTTPS Git operations to the WSL GitHub credential rather than a Windows credential helper.

Do not install a second hidden Docker daemon in WSL when Docker Desktop integration is the chosen runtime. Do not copy another developer's GitHub token or checkout to bypass private-repository authentication.

## Clone location

Clone both repositories into the WSL-native filesystem:

```bash
cd ~
mkdir -p repos
cd repos
git clone https://github.com/Ashleyrfj2/Demo.git
git clone https://github.com/Ashleyrfj2/Fest.git
```

Expected paths:

```text
~/repos/Demo
~/repos/Fest
```

Never use `/mnt/c`, `/mnt/e`, or another mounted Windows drive for the active clones. From each repository, run `code .` to open the WSL workspace.

Do not copy `node_modules`, `.expo`, Supabase state, `.env` files, generated manifests, test results, Docker volumes, or Playwright browser caches between machines.

## Shared pinned toolchain

Both repositories pin:

```text
Node 22.21.0
npm  10.9.4
```

Use `nvm` inside WSL and let `.nvmrc` select Node:

```bash
nvm install
nvm use
node --version
npm --version
```

Expected:

```text
v22.21.0
10.9.4
```

If npm differs after selecting Node:

```bash
npm install --global npm@10.9.4
```

Do not use Windows Node/npm against this WSL checkout.

## Fresh Festival setup

```bash
cd ~/repos/Fest
git switch main
git pull --ff-only origin main
nvm install
nvm use
npm ci
npx playwright install --with-deps chromium
npm run workspace:check
npm run lint -- --no-cache
npx tsc --noEmit
npm test
```

`workspace:check` fails on the wrong Node/npm version, a `/mnt/*` WSL checkout, CRLF in guarded shell scripts, missing packages, or missing Playwright Chromium.

For CI/toolchain-only verification that does not require browser binaries or local services:

```bash
npm run workspace:check:toolchain
```

## Local Festival Supabase

Docker Desktop must be reachable inside WSL.

Use only the repository-pinned Supabase CLI through `npx supabase`; global npm installation is unsupported.

```bash
./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh
npx supabase status
```

On a fresh clone:

```bash
cp .env.example .env
npx supabase status
```

Populate only local values reported by `npx supabase status`:

```text
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
```

Never copy Ashley's `.env`, service-role key, Supabase volume, or seeded state.

After the local `.env` values are set, verify the full browser suite:

```bash
npm run test:browser
```

Festival local ports:

```text
54321  Supabase API
54322  Festival PostgreSQL
54323  Studio
54324  local inbox
```

## Browser workflow

```bash
# controlled browser export
npm run browser:serve

# one demo browser test run
npm run test:demo-browser

# three isolated runs with a reset before each run
npm run test:demo-browser:repeat
```

The browser server binds only to `127.0.0.1:4173`. Port checks never kill an unknown listener. If `4173` is occupied, identify and stop the owning process deliberately.

The supported composed-workflow shell is Bash on macOS or inside WSL. Native PowerShell is not the normal repository runtime shell.

## Cross-repository service order

For Demo + Festival work on Riley's machine:

1. Docker Desktop running with WSL integration.
2. Festival local Supabase started/reset.
3. Festival browser export on `127.0.0.1:4173`.
4. Demo local credentials created on Riley's machine.
5. Demo PostgreSQL/API started.
6. Demo frontend started only when needed.
7. Run the relevant composed preflight/proof/test.

Festival never owns or resets Demo PostgreSQL. Demo never resets Festival Supabase outside approved Festival tooling.

## Port and trust-domain contract

```text
Festival browser        127.0.0.1:4173
Demo frontend           127.0.0.1:5173
Demo API                127.0.0.1:8080
Festival Supabase API   127.0.0.1:54321
Festival PostgreSQL     127.0.0.1:54322
Demo PostgreSQL         127.0.0.1:54332
```

Never mix credentials, JWTs, migrations, database URLs, reset commands, service-role keys, Docker volumes, or database state between repositories or machines.

## Agent first-task contract

Before editing, an agent on Riley's WSL machine must:

```bash
git status --short
git branch --show-current
git fetch origin
git diff origin/main...HEAD --name-only
git rev-parse --show-toplevel
node --version
npm --version
npm run workspace:check
```

The agent must read `AGENTS.md` first and preserve unrelated changes. If the current branch/diff does not match the task, it must stop rather than mixing work.

## Identity and current evidence boundary

The strict Festival producer identity remains:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Fresh August 27 local receipts verify Gate 3, live M5B override/retry/restart/freeze progression, and M6 deeper heterogeneous Playwright/backend evidence. M6 is merged in Demo PR #23. **M7 accelerator-demo recording is next.**

Native WSL composed-runtime proof remains **unverified** until Riley actually executes the composed workflow on his machine. A clean clone/install or static test pass is not WSL runtime proof.

Manual composition through a Codespaces forwarded browser remains unsupported unless separately implemented.
