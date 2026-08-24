# macOS and native-WSL workspace contract

Ashley and Riley should run the same tracked code with machine-local dependencies.

## Clone location

- macOS: keep the clone in a normal local macOS folder.
- WSL: clone into `~/repos/Fest`, never `/mnt/c`, `/mnt/e`, or another mounted
  Windows drive. From that directory, run `code .` to open the WSL workspace.
- Do not copy `node_modules`, `.expo`, Supabase state, generated manifests, test
  results, or Playwright browser caches between machines.

## Fresh setup

```bash
git switch main
git pull --ff-only origin main
nvm install
nvm use
npm ci
```

Install Chromium once per operating system:

```bash
# macOS
npx playwright install chromium

# native WSL
npx playwright install --with-deps chromium
```

CI and pre-install automation can verify only the pinned Node/npm contract without
requiring Playwright Chromium or local services:

```bash
npm run workspace:check:toolchain
```

After dependencies and Chromium are installed, verify the complete checkout and
then start the guarded local services:

```bash
npm run workspace:check
./scripts/demo/start-local-supabase.sh
./scripts/demo/reset-demo.sh
```

## Browser workflow

```bash
# one run
npm run test:demo-browser

# three isolated runs with a reset before each run
npm run test:demo-browser:repeat
```

The browser server binds only to `127.0.0.1`. Port checks never kill an unknown
listener. If `4173` is occupied, stop the owning terminal or inspect the verified
process before retrying. Each machine has independent local databases and test state.

The supported composed-workflow shell is Bash on macOS or inside WSL. Native
PowerShell remains supported only for repository branch-hygiene checks.

## Identity, merge order, and current evidence boundary

The Festival export produces schema `1`, service `festnest-browser-export`, build
`festnest-demo-001`, scenario `equipment-handoff-v1`, the controlled camp-grid route,
and an `artifactId` matching `sha256:<64 lowercase hex characters>`. Festival owns the
listener and cleanup; Demo never stops it. Merge the Fest producer before the Demo
strict consumer.

Fest Actions Lint run #49 is green at implementation tip `4c766e2`. No Supabase
reset/seed, live browser run, repeated workflow, native-WSL replay, or live composed
Festival → Demo runtime was executed at the final implementation tips. Native WSL
therefore remains unverified. Manual composition through a Codespaces forwarded browser
is unsupported unless separately implemented.
