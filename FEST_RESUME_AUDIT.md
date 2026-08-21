# 1. Project identity

- **Project name:** FestNest (`package.json`, `README.md`)
- **One-sentence description:** Mobile app for coordinating group camping music festival trips, with trip creation, shared planning modules, offline-capable safety/camp features, and Supabase-backed collaboration (`README.md`, `app/trips/[id].tsx`, `lib/hooks/*`).
- **Application type:** Cross-platform mobile app with Expo/React Native and some web support through Expo web (`package.json`, `app.json`).
- **Intended users:** Festival trip organizers and group members coordinating camping logistics (`README.md`, `docs/product/design-spec.md`, `app/trips/create.tsx`, `app/join/[code].tsx`).
- **Current development status:** In progress, with a fully working backend and multiple functional end-to-end user flows already present in the client (`lib/supabase.ts`, `lib/auth/AuthContext.tsx`, `app/trips/create.tsx`, `app/join/[code].tsx`, `lib/hooks/useTravel.ts`, `lib/hooks/useSupplyList.ts`).
- **Prototype / MVP / beta / production assessment:** Best described as an in-progress MVP or beta-stage build with a working backend, not confirmed production software. Reason: authentication, shared invites, live updates, and Supabase-backed persistence are functional, but several settings/help surfaces remain scaffolded or placeholder, testing is primarily simulated/manual, and no confirmed deployment pipeline is present (`app/settings/help.tsx`, `app/settings/notifications.tsx`, `.github/workflows/lint.yml`).
- **Public repository URL:** `https://github.com/Ashleyrfj2/Fest.git` (`git remote -v`).
- **Deployment URLs, if confirmed:** `festnest.app` appears in deep-link and invite configuration, but a live deployment is not confirmed in repo configuration (`app.json`, `lib/invites/invite-utils.ts`). Do not describe the app as definitely live.
- **Date range of development in local Git history:** March 19, 2026 through June 16, 2026 (`git log --all --reverse`, `git log --all`).

# 2. Confirmed technology stack

| Technology | How it is used | Evidence file | Confidence |
| --- | --- | --- | --- |
| TypeScript | Main application language for app, hooks, data types, and config | `package.json`, `tsconfig.json`, `app/`, `lib/` | High |
| React 19 | UI runtime | `package.json` | High |
| React Native | Native UI layer for screens and components | `package.json`, `app/*.tsx`, `components/*.tsx` | High |
| Expo SDK 55 | App runtime and platform integration | `package.json`, `app.json` | High |
| Expo Router | File-based navigation for tabs, auth, trips, and settings | `package.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx` | High |
| Supabase JS | Auth, database queries, realtime subscriptions | `package.json`, `lib/supabase.ts`, `lib/hooks/*.ts` | High |
| PostgreSQL via Supabase | Primary shared database with RLS and migrations | `supabase/migrations/*.sql`, `lib/database.types.ts` | High |
| Supabase Auth | Anonymous guest accounts, email registration, sign-in, account upgrade | `lib/auth/AuthContext.tsx`, `app/auth/*.tsx`, `docs/setup/auth-system.md` | High |
| Supabase Realtime | Live updates for travel, supply list, activity feed, budget, lineup, meals, collaboration | `lib/hooks/useTravel.ts`, `useSupplyList.ts`, `useActivityFeed.ts`, `useBudgetTracker.ts`, `useLineup.ts`, `useFoodPlanner.ts`, `useCollaboration.ts` | High |
| Expo SQLite | Local offline storage for camp grid, safety, and packing data | `package.json`, `lib/sqlite/db.ts`, `lib/sqlite/safetyDb.ts`, `lib/sqlite/packingDb.ts` | High |
| Expo Secure Store | Device storage for safety encryption keys | `package.json`, `lib/crypto/safetyEncryption.ts` | High |
| Expo Crypto / Web Crypto | Invite code randomness, local IDs, safety encryption, PIN hashing | `package.json`, `lib/invites/invite-utils.ts`, `lib/crypto/safetyEncryption.ts`, `lib/sqlite/packingDb.ts`, `lib/sqlite/useCampGridDB.ts` | High |
| AsyncStorage | Session persistence and lightweight app usage tracking | `package.json`, `lib/supabase.ts`, `lib/auth/AuthContext.tsx` | High |
| react-native-maps | Shared meetup map UI in Travel module | `package.json`, `components/Travel/MeetupMap.tsx` | High |
| Lucide React Native | App icon system | `package.json`, `components/Icon.tsx`, many screen/component imports | High |
| ESLint | Linting locally and in CI | `package.json`, `.github/workflows/lint.yml` | High |
| GitHub Actions | CI workflow for lint only | `.github/workflows/lint.yml` | High |
| Expo web / Metro | Web output and Metro bundling | `app.json`, `metro.config.js` | High |

**Not confirmed in repository code as working integrations**

- File/image storage buckets are planned or documented through Supabase, but active upload flows are not confirmed in the shipped code reviewed here (`docs/setup/supabase-setup.md`, `docs/product/design-spec.md`).
- Push notifications are scaffolded in settings UI only; no notification service implementation is present (`app/settings/notifications.tsx`).
- Analytics are not confirmed.
- A custom backend/API server is not present; the client talks directly to Supabase from hooks and screens.

# 3. Implemented application features

## Fully implemented or strongly evidenced features

1. **Authentication with guest and email paths**
   - **What it does:** Supports anonymous guest account creation, email registration, sign-in, profile setup, and guest-to-email upgrade.
   - **Main technologies:** Supabase Auth, AsyncStorage, Expo Router.
   - **Relevant files:** `lib/auth/AuthContext.tsx`, `app/auth/welcome.tsx`, `app/auth/guest-setup.tsx`, `app/auth/register.tsx`, `app/auth/sign-in.tsx`, `app/onboarding/set-profile.tsx`.
   - **Status:** Complete for basic flows; some account hardening remains.
   - **Resume value:** High.

2. **Trip creation, invite links, and join flow**
   - **What it does:** Creates trips, generates invite codes and links, joins by invite code, adds membership rows, and logs activity.
   - **Main technologies:** Supabase tables, Expo Router, Expo Crypto.
   - **Relevant files:** `app/trips/create.tsx`, `app/join/[code].tsx`, `lib/invites/invite-utils.ts`, `supabase/migrations/20260319000000_initial_schema.sql`.
   - **Status:** Complete for core flow.
   - **Resume value:** High.

3. **Trip dashboard with module navigation and crew/activity summary**
   - **What it does:** Loads trip details, crew list, recent activity, share button, and routes into module screens.
   - **Main technologies:** Expo Router, Supabase, reusable dashboard components.
   - **Relevant files:** `app/trips/[id].tsx`, `components/trips/dashboard/*`.
   - **Status:** Complete with some "coming soon" settings actions.
   - **Resume value:** High.

4. **Cross-trip activity feed**
   - **What it does:** Pulls recent `activity_logs` entries across trips, groups by day, supports refresh and tap-through to trips.
   - **Main technologies:** Supabase realtime, FlatList UI.
   - **Relevant files:** `app/(tabs)/activity.tsx`, `lib/hooks/useActivityFeed.ts`.
   - **Status:** Complete.
   - **Resume value:** Medium.

5. **Camp Grid offline-first layout planner**
   - **What it does:** Landscape campsite planning with custom dimensions, drag/tap item placement, snapping, custom items, rotation, local SQLite persistence, and explicit shared save to Supabase.
   - **Main technologies:** Expo SQLite, Supabase, React Native gesture/UI flow.
   - **Relevant files:** `app/trips/[id]/camp-grid.tsx`, `components/CampGrid/*`, `lib/sqlite/useCampGridDB.ts`, `lib/sqlite/db.ts`, `lib/campGridTypes.ts`.
   - **Status:** Strongly implemented.
   - **Resume value:** High.

6. **Camp Grid destructive-overwrite protection**
   - **What it does:** Blocks destructive saves when remote layout verification fails or shared rows may be deleted, with retry/overwrite confirmation paths.
   - **Main technologies:** SQLite/Supabase sync logic, client-side guard logic.
   - **Relevant files:** `lib/sqlite/useCampGridDB.ts`, `app/trips/[id]/camp-grid.tsx`, `docs/test-notes.md`, commit `8fcf4b1`.
   - **Status:** Complete for the documented blocker fix.
   - **Resume value:** High.

7. **Supply list with claiming, packed state, duplicate detection, and realtime sync**
   - **What it does:** CRUD for shared supply items, claim/unclaim flow, packed status, category grouping, fuzzy duplicate lookup, progress bar, and activity logging.
   - **Main technologies:** Supabase realtime, TypeScript hooks, React Native component grouping.
   - **Relevant files:** `app/trips/[id]/supply-list.tsx`, `components/SupplyList/*`, `lib/hooks/useSupplyList.ts`, `lib/supplyTypes.ts`.
   - **Status:** Complete.
   - **Resume value:** High.

8. **Food planner with meal days, meal slots, ingredient sync, and duplicate meal flow**
   - **What it does:** Creates/edit/deletes meals by day and slot, records dietary flags and cooks, duplicates meals, and syncs ingredients into the supply list.
   - **Main technologies:** Supabase, modal form components, shared type layer.
   - **Relevant files:** `app/trips/[id]/food-planner.tsx`, `components/FoodPlanner/*`, `lib/hooks/useFoodPlanner.ts`, `lib/foodPlannerTypes.ts`.
   - **Status:** Implemented with some refinement still documented.
   - **Resume value:** High.

9. **Travel planning with vehicles, passengers, flights, and shared meetup pin**
   - **What it does:** Tracks vehicles and capacity, lets users join or leave rides, stores flight details, and manages a shared meetup pin on a map.
   - **Main technologies:** Supabase realtime, `react-native-maps`, role-aware mutation logic.
   - **Relevant files:** `app/trips/[id]/travel.tsx`, `components/Travel/*`, `lib/hooks/useTravel.ts`, `lib/travelTypes.ts`, `supabase/migrations/20260406000000_add_trip_meetup_pin.sql`.
   - **Status:** Implemented.
   - **Resume value:** High.

10. **Functional group invite links and join-by-share flow**
   - **What it does:** Generates shareable invite URLs, validates invite codes, previews the trip before joining, and adds a new member on acceptance.
   - **Main technologies:** Expo Router, Supabase, Expo Crypto.
   - **Relevant files:** `lib/invites/invite-utils.ts`, `app/join/[code].tsx`, `app/trips/create.tsx`, `app.json`.
   - **Status:** Implemented.
   - **Resume value:** High.

11. **Travel viewer write restrictions**
   - **What it does:** Enforces read-only behavior for non-editor roles both in UI and mutation hooks.
   - **Main technologies:** Role checks in screen and hook logic.
   - **Relevant files:** `app/trips/[id]/travel.tsx`, `lib/hooks/useTravel.ts`, `docs/test-notes.md`, commit `c0aef1f`.
   - **Status:** Implemented.
   - **Resume value:** Medium.

12. **Lineup scheduler with artist voting, consensus, conflict detection, and preset import**
   - **What it does:** Loads artists, stores per-user votes, computes consensus, detects overlapping must-see sets, and auto-imports preset artist names for supported festivals.
   - **Main technologies:** Supabase realtime, vote aggregation logic.
   - **Relevant files:** `app/trips/[id]/lineup.tsx`, `components/Lineup/*`, `lib/hooks/useLineup.ts`, `lib/lineupFestivalArtists.ts`.
   - **Status:** Implemented.
   - **Resume value:** High.

13. **Packing checklist with local SQLite storage and supply-item sync**
   - **What it does:** Seeds starter packing templates, supports manual items and assignment, tracks per-user packed state locally, and syncs claimed supply items into packing items.
   - **Main technologies:** Expo SQLite, Supabase reads for claimed supply items.
   - **Relevant files:** `app/trips/[id]/packing-checklist.tsx`, `lib/hooks/usePackingListLocal.ts`, `lib/sqlite/packingDb.ts`, `lib/packingTypes.ts`.
   - **Status:** Implemented.
   - **Resume value:** High.

14. **Safety profile with encrypted storage, offline cache, and PIN-protected emergency access**
   - **What it does:** Encrypts safety profile data before storage, keeps local SQLite cache, supports emergency-access PIN creation/clearing, and rehydrates remote encrypted rows when needed.
   - **Main technologies:** Expo Secure Store, Expo Crypto, Web Crypto, SQLite, Supabase.
   - **Relevant files:** `app/trips/[id]/safety-profile.tsx`, `app/trips/[id]/safety-emergency.tsx`, `components/SafetyProfile/*`, `lib/hooks/useSafetyProfile.ts`, `lib/crypto/safetyEncryption.ts`, `lib/sqlite/safetyDb.ts`, `supabase/migrations/20260410000000_add_safety_emergency_pin_access.sql`.
   - **Status:** Implemented with recent reliability fixes.
   - **Resume value:** High.

15. **Budget tracker with equal/custom splits and settle-up calculation**
   - **What it does:** Adds shared expenses, calculates balances and settlements, supports equal or custom splits, and logs mutations.
   - **Main technologies:** Supabase, TypeScript financial calculation logic.
   - **Relevant files:** `app/trips/[id]/budget.tsx`, `components/BudgetTracker/*`, `lib/hooks/useBudgetTracker.ts`, `lib/budgetTypes.ts`.
   - **Status:** Implemented.
   - **Resume value:** High.

16. **Settings and profile management surfaces**
   - **What it does:** Provides profile editing, account status, sign-out, help/support pages, privacy/account pages, and settings navigation.
   - **Main technologies:** Expo Router, AuthContext, shared settings components.
   - **Relevant files:** `app/(tabs)/profile.tsx`, `app/settings/index.tsx`, `app/settings/privacy.tsx`, `app/settings/help.tsx`, `components/settings/SettingsComponents.tsx`.
   - **Status:** Mixed; some pages are functional, some contain placeholder actions.
   - **Resume value:** Medium.

## Partially implemented or mixed-completeness features

1. **Collaboration approval queue**
   - **What it does:** Schema, RLS, hook, realtime subscription, and pending queue display exist.
   - **Evidence:** `supabase/migrations/20260405000000_change_proposals.sql`, `lib/hooks/useApprovalQueue.ts`, `app/trips/[id]/collaboration.tsx`.
   - **Limitation:** No confirmed module UIs create or resolve proposals outside the hook layer; `rg` only found approval actions inside hooks. Treat as partial.
   - **Resume value:** Medium.

2. **Trip progress aggregation**
   - **What it does:** Computes progress for supply, travel, packing, and safety.
   - **Evidence:** `lib/hooks/useModuleProgress.ts`.
   - **Limitation:** The same hook still labels `food`, `lineup`, and `budget` as not implemented even though those screens and hooks exist. This is a status mismatch, not proof those modules are absent.
   - **Resume value:** Low.

3. **Guest restrictions**
   - **What it does:** Prevents guest users from creating trips and deep-linking into trip modules; shows upgrade/register prompts.
   - **Evidence:** `app/_layout.tsx`, `app/trips/create.tsx`, `components/auth/GuestAccessModal.tsx`.
   - **Limitation:** Product docs still describe a broader future guest-demo mode that is not fully implemented.
   - **Resume value:** Medium.

4. **Notifications settings**
   - **What it does:** Settings UI for notification categories and timing controls.
   - **Evidence:** `app/settings/notifications.tsx`.
   - **Limitation:** State is local UI only; no push notification service, persistence, or backend wiring is present.
   - **Resume value:** Low.

5. **Appearance settings**
   - **What it does:** Appearance route exists.
   - **Evidence:** `app/settings/appearance.tsx`.
   - **Limitation:** Product docs and session notes describe this as scaffolded rather than finished.
   - **Resume value:** Low.

6. **Help / privacy support content**
   - **What it does:** Support email actions and app info are live.
   - **Evidence:** `app/settings/help.tsx`.
   - **Limitation:** FAQ and privacy policy content still open a "coming soon" alert.
   - **Resume value:** Low.

7. **Delete account flow**
   - **What it does:** UI and warning modal exist.
   - **Evidence:** `app/settings/privacy.tsx`, `docs/product/features.md`.
   - **Limitation:** Secure backend deletion is explicitly not wired.
   - **Resume value:** Low.

8. **Discover tab**
   - **What it does:** Route exists with title/subtitle.
   - **Evidence:** `app/(tabs)/discover.tsx`.
   - **Limitation:** Placeholder screen only.
   - **Resume value:** Low.

## Planned or documented but not implemented

1. **Camp Grid collision detection**
   - **Evidence:** `docs/product/design-spec.md`, `docs/user-side-audit-checklist.md`.

2. **Camp Grid export/share as PNG**
   - **Evidence:** `docs/product/design-spec.md`, `docs/user-side-audit-checklist.md`.

3. **Live festival mode**
   - **Evidence:** `docs/product/features.md`, `docs/product/feature-completion.md`.

4. **Mesh / no-signal networking mode**
   - **Evidence:** `docs/product/features.md`, `docs/product/feature-completion.md`.

5. **Weather integration**
   - **Evidence:** `docs/product/features.md`, `docs/product/feature-completion.md`.

6. **Past-trip reuse / festival profiles**
   - **Evidence:** `docs/product/features.md`, `docs/product/feature-completion.md`.

7. **Travel multi-pin map and richer route visualization**
   - **Evidence:** `docs/product/feature-completion.md`, `docs/test-notes.md`.

8. **Forgot password**
   - **Evidence:** `app/auth/sign-in.tsx` contains `TODO` and a "Password reset coming soon!" alert.

# 4. Architecture and engineering work

## Plain-language architecture

- **Front end:** The app is a single Expo/React Native client organized around file-based routes in `app/`. Tabs, auth, onboarding, settings, trip dashboard, and trip modules are all client-rendered screens (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`).
- **Back end:** There is no separate Node/Express/Nest API in the repository. The backend is fully functional through Supabase for auth, database, row-level security, and realtime updates, with shared data access done directly from the client through the Supabase JS client (`lib/supabase.ts`, `lib/hooks/*.ts`, `supabase/migrations/*.sql`).
- **Data layer:** Most collaborative modules use a screen + hook + typed-model pattern. Screens handle UI, hooks handle Supabase fetch/realtime/mutations, and type files define the data shape (`lib/hooks/*.ts`, `lib/*Types.ts`, `lib/database.types.ts`).
- **Local and remote data handling:** Camp Grid, Safety, and Packing use local SQLite storage for offline-first behavior. Camp Grid and Safety also merge or sync data with Supabase (`lib/sqlite/useCampGridDB.ts`, `lib/sqlite/safetyDb.ts`, `lib/hooks/useSafetyProfile.ts`, `lib/hooks/usePackingListLocal.ts`).
- **Navigation:** Expo Router handles auth gating, tab routing, deep-link invite entry, and per-trip module routes (`app/_layout.tsx`, `app.json`).
- **Authentication flow:** Supabase Auth sessions are loaded in `AuthContext`, which gates navigation and supports guest accounts, email sign-in, and upgrade flows (`lib/auth/AuthContext.tsx`, `app/auth/*.tsx`).
- **State management:** Mostly local React state plus custom hooks; no Redux/Zustand/MobX layer is present.
- **Validation:** Client-side validation is spread through screens and hooks, such as trip form date validation, PIN format validation, and budget split validation (`app/trips/create.tsx`, `app/trips/[id]/safety-profile.tsx`, `lib/hooks/useBudgetTracker.ts`).
- **Security:** The strongest confirmed controls are Supabase RLS, self-owned safety profile rules, role checks for trip editing, and local encryption for safety data (`supabase/migrations/20260319000001_rls_policies.sql`, `lib/crypto/safetyEncryption.ts`).
- **Error handling:** Most modules expose `error` state from hooks and show alert/error text in screens. Some critical flows fail closed, notably recent safety PIN preservation logic and camp-grid destructive save blocking (`lib/hooks/useSafetyProfile.ts`, `app/trips/[id]/camp-grid.tsx`).
- **Reusable components:** Module UIs are broken into reusable cards, modals, and grouped components under `components/`.
- **Separation of concerns:** Generally good for a solo/mobile app codebase. Screens are mostly thin, while hooks contain data logic and migrations encode backend structure.

## Confirmed difficult parts

1. **Offline + shared sync for Camp Grid**
   - Difficult because the app keeps a local SQLite draft, compares it with a shared Supabase snapshot, and must avoid destructive overwrites when remote verification fails.
   - Evidence: `lib/sqlite/useCampGridDB.ts`, `docs/test-notes.md`, commit `8fcf4b1`.

2. **Encrypted Safety data with device-held keys**
   - Difficult because the client encrypts/decrypts sensitive fields locally, stores keys in Secure Store, supports offline cache, and now handles PIN-rotation and remote rehydrate edge cases.
   - Evidence: `lib/crypto/safetyEncryption.ts`, `lib/hooks/useSafetyProfile.ts`, `lib/sqlite/safetyDb.ts`, commits `2135d71`, `417bc6a`, `444f9ba`.

3. **Realtime collaborative module behavior**
   - Difficult because multiple modules subscribe to Supabase changes and combine role-based writes with live UI refresh.
   - Evidence: `lib/hooks/useTravel.ts`, `useSupplyList.ts`, `useLineup.ts`, `useFoodPlanner.ts`, `useBudgetTracker.ts`, `useCollaboration.ts`.

4. **Budget settle-up logic**
   - Difficult because the app derives creditor/debtor settlements from equal or custom splits without storing extra summary tables.
   - Evidence: `lib/hooks/useBudgetTracker.ts`.

# 5. My confirmed contributions

## Attribution summary

- **Local contributor evidence:** `git shortlog -sne --all` shows only two local author strings:
  - `AshleyRFJ2 <AshleyRFJ2@gmail.com>` with 37 commits
  - `Ashley <ashleyrfj2@gmail.com>` with 2 merge commits
- **Attributable to `Ashleyrfj2`:** 39 local commits across all refs appear attributable to the same GitHub account or email identity family. 37 are direct commits and 2 are merge commits. Personal ownership is well-supported at the repository level.
- **Important authorship qualification from user clarification:** The app concept, product plan, and deep planning were your own, and most implementation was executed through coding agents/AI under your direction. Resume positioning should emphasize environment design, product definition, technical direction, verification, and agent orchestration rather than implying every file was manually typed by you.
- **Total local repo commits:** 39 (`git rev-list --count --all`).

## Meaningful confirmed contributions

1. **`27bc14f` — 2026-03-19 — `Database and placeholders`**
   - **Files changed:** initial app shell, Supabase schema/RLS, config, docs.
   - **What changed:** Established the initial Expo app structure, route placeholders, Supabase client, and first database migrations.
   - **Skills demonstrated:** TypeScript setup, Expo config, database schema design, RLS setup.
   - **Classification:** Original baseline / starter project creation.

2. **`68c4907` — 2026-03-31 — `Create trip and register working`**
   - **Files changed:** auth and onboarding screens, migrations.
   - **What changed:** Advanced registration and trip-creation flow from placeholder state to a working path.
   - **Skills demonstrated:** Auth flow wiring, routing, database integration.
   - **Classification:** Original feature work.

3. **`6fe8f38` — 2026-04-01 — `Snap Grid`**
   - **Files changed:** camp-grid screen/components, local SQLite migration, camp-grid types.
   - **What changed:** Built the camp-grid interaction model with snapped positioning, local storage, presets, and supporting types.
   - **Skills demonstrated:** Offline/local persistence, UI interaction design, data modeling.
   - **Classification:** Original feature work.

4. **`0fea14d` — 2026-04-03 — `feat: add useSafetyProfile and useSupplyList hooks for managing safety profiles and supply items with encryption and offline support`**
   - **Files changed:** safety and supply screens/components/hooks, encryption/storage helpers, test script.
   - **What changed:** Added core Safety and Supply module logic, including encrypted safety handling and supply-list data hooks.
   - **Skills demonstrated:** Security-minded client engineering, hook design, CRUD architecture.
   - **Classification:** Original feature work.

5. **`5eadc18` — 2026-04-03 — `feat: Implement Travel Plans module with vehicle, flight, meetup, and outfit voting features`**
   - **Files changed:** Travel screen/components/hooks/types.
   - **What changed:** Added the first full Travel module implementation with vehicle, flight, map, and outfit-related UI.
   - **Skills demonstrated:** Realtime data management, maps UI, modular screen/component construction.
   - **Classification:** Original feature work. Note: later docs moved outfit voting out of active scope.

6. **`02aed70` — 2026-04-04 — `Packing`**
   - **Files changed:** packing checklist, activity feed, collaboration hook, packing types.
   - **What changed:** Added the Packing module and expanded trip-level supporting flows.
   - **Skills demonstrated:** Local data handling, trip module integration, collaboration plumbing.
   - **Classification:** Original feature work.

7. **`50d2f9a` — 2026-04-05 — `Budget tracker, activity feed, lineup, food`**
   - **Files changed:** budget, collaboration, food planner, lineup screens/components/hooks/types.
   - **What changed:** Added several major planning modules plus the approval queue hook layer and progress framework.
   - **Skills demonstrated:** Feature expansion across multiple modules, shared hook architecture, financial logic, scheduling/voting logic.
   - **Classification:** Original feature work.

8. **`bfb753c` — 2026-04-05 — `Fix db issue - clean`**
   - **Files changed:** database types, meal/budget/lineup/change-proposal migrations, food planner hook.
   - **What changed:** Repaired migration/schema alignment and database typing for the new modules.
   - **Skills demonstrated:** Schema maintenance, migration debugging, typed database integration.
   - **Classification:** Bug fix / schema maintenance.

9. **`bcf51f0` — 2026-04-07 — `Fixed travel modal and added detail pins`**
   - **Files changed:** travel forms, map, hook, migration adding trip-level meetup pin.
   - **What changed:** Improved Travel usability and moved meetup-pin data toward a trip-level model with richer metadata.
   - **Skills demonstrated:** UX bug fixing, map feature work, schema evolution.
   - **Classification:** Original improvement + bug fix.

10. **`2135d71` — 2026-04-10 — `Safeview and safety module updates`**
   - **Files changed:** safety screens/hooks/db, budget screen, activity/discover/profile tabs, safety migration.
   - **What changed:** Strengthened safety module behavior, safe-area handling, and emergency PIN support.
   - **Skills demonstrated:** Mobile UX hardening, security workflow refinement, schema updates.
   - **Classification:** Original feature improvement and reliability work.

11. **`7cd282f` — 2026-04-12 — `audit`**
   - **Files changed:** lint config, workflow, multiple trip module screens, docs.
   - **What changed:** Added lint gate and performed multi-module QA/remediation pass.
   - **Skills demonstrated:** Code quality tooling, QA follow-up, repo maintenance.
   - **Classification:** Quality and maintenance work.

12. **`c0aef1f` — 2026-04-20 — `bugs`**
   - **Files changed:** travel screen/cards/hook, docs.
   - **What changed:** Fixed Travel module issues and closed QA blockers around write restrictions and meetup pin behavior.
   - **Skills demonstrated:** Bug fixing, role enforcement, realtime behavior fixes.
   - **Classification:** Bug fix.

13. **`417bc6a` — 2026-04-22 — `Idr`**
   - **Files changed:** auth/layout/trip dashboard/trip creation/safety files/docs.
   - **What changed:** Hardened guest restrictions and safety behavior and updated related product docs and audits.
   - **Skills demonstrated:** Auth gating, safety reliability, UX restriction enforcement.
   - **Classification:** Reliability / product hardening.

14. **`8fcf4b1` — 2026-04-22 — `sprint 1`**
   - **Files changed:** camp-grid screen and sync hook, docs/audits.
   - **What changed:** Addressed camp-grid save-risk issues and aligned docs around current module state.
   - **Skills demonstrated:** Offline/shared sync safety, QA-driven remediation.
   - **Classification:** Bug fix / reliability hardening.

15. **`444f9ba` — 2026-06-16 — `04/22`**
   - **Files changed:** safety hook, docs, plus unrelated `tmp/` shell scripts.
   - **What changed:** Included safety-related changes, but the commit also contains unrelated filesystem cleanup scripts.
   - **Skills demonstrated:** Repository-level evidence of continued maintenance.
   - **Classification:** Mixed-purpose commit; do not use as a clean resume example without narrowing the exact project-related diff.

## Contribution summary

- **Number of commits attributable to you:** 39 across local refs; 37 direct + 2 merge commits (`git shortlog -sne --all`).
- **Main areas of the codebase you worked on:** auth/onboarding, camp grid, safety, travel, packing, supply list, food planner, lineup, budget tracker, documentation, QA notes, and database migrations.
- **Features you appear to own heavily:** Camp Grid, Safety module, Travel module, Supply List, and several cross-module infrastructure pieces.
- **Bugs you fixed:** Auth race condition, travel modal/map issues, viewer write restrictions, camp-grid destructive save risk, safety PIN preservation/rehydration issues, safe-area/UI issues.
- **Refactoring completed:** Schema/migration cleanup, typed database refresh, moving meetup pin to trip-level field, centralizing shared hooks.
- **Documentation written:** Extensive product docs, handoffs, QA notes, and setup docs.
- **Tests added:** A manual encryption test script exists (`scripts/test-encryption.ts`), but no formal automated test suite was added.
- **Architecture or product decisions visible in commits:** Offline-first camp/safety/packing design, direct-to-Supabase architecture, guest-account onboarding, and role-based collaboration constraints.
- **Best-fit ownership framing from user clarification:** original app idea and plan, directed agent-heavy implementation, reviewed outputs, and steered feature/product decisions to a working Supabase-backed application.

# 6. Code quality and testing

## Confirmed evidence

- **Linting:** Present and wired to CI (`package.json`, `.github/workflows/lint.yml`).
- **Type checking:** TypeScript strict mode is enabled (`tsconfig.json`).
- **Local verification run during this audit:** `npm run lint` passed and `npx tsc --noEmit` passed on July 10, 2026 in the local workspace.
- **Manual QA documentation:** Extensive manual QA and regression notes exist (`docs/test-notes.md`, `docs/reports/*.md`, `docs/user-side-audit-checklist.md`).
- **Testing mode confirmed by user:** testing described here was simulated rather than verified on live production users or real festival operations.
- **Validation logic:** Present in forms and hooks for dates, PINs, expense splits, etc. (`app/trips/create.tsx`, `app/trips/[id]/safety-profile.tsx`, `lib/hooks/useBudgetTracker.ts`).
- **Error handling:** Most screens expose loading/error states and alerts (`app/trips/[id]/*.tsx`, `lib/hooks/*.ts`).
- **Security controls:** RLS and local encryption are explicitly implemented (`supabase/migrations/20260319000001_rls_policies.sql`, `lib/crypto/safetyEncryption.ts`).

## Missing or not confirmed

- **Unit tests:** No Jest/Vitest test suite found.
- **Integration tests:** None found.
- **End-to-end tests:** None found.
- **Coverage reporting:** None found.
- **CI build matrix:** Not present; only lint is in GitHub Actions.
- **Automated typecheck in CI:** Not present in the workflow file reviewed.
- **Automated app build/export verification:** Not present.
- **Structured logging/telemetry:** Limited to `console.error` and manual QA notes; no dedicated logging platform is configured.

# 7. Product and user-experience work

## Implemented product / UX work

- Guest-access restrictions for trip creation and module entry (`app/_layout.tsx`, `app/trips/create.tsx`, `components/auth/GuestAccessModal.tsx`).
- Type-ahead and date autofill for popular festivals in trip creation (`app/trips/create.tsx`, `lib/festivalTripOptions.ts`).
- Safe-area fixes across routes and modal flows (`docs/test-notes.md`, `app/_layout.tsx`, `app/trips/[id]/food-planner.tsx`, `app/trips/[id]/budget.tsx`).
- Empty states across modules and dashboard prompts (`app/trips/[id]/supply-list.tsx`, `app/trips/[id]/food-planner.tsx`, `app/trips/[id]/safety-profile.tsx`).
- Settings navigation design with separate privacy/help/notifications/appearance pages (`app/settings/*.tsx`, `components/settings/SettingsComponents.tsx`).

## Planning / research / documented product work

- Product requirements and module definitions (`docs/product/design-spec.md`, `docs/product/data-model.md`, `docs/product/trip-system.md`).
- UX and onboarding decisions (`docs/product/onboarding.md`, `docs/product/ui-decisions.md`).
- Feature completion tracking (`docs/product/feature-completion.md`).
- Future/offline/low-connectivity ideas including mesh mode (`docs/product/features.md`).
- QA audit checklists and user-side audit notes (`docs/user-side-audit-checklist.md`, `docs/reports/*.md`).

## Accessibility / responsive evidence

- Safe-area handling is explicitly addressed and repeatedly audited (`docs/test-notes.md`, `app/_layout.tsx`, `SafeAreaView` usage across screens).
- Responsive behavior is partially addressed for Camp Grid sizing and compact headers (`app/trips/[id]/camp-grid.tsx`).
- I did not find explicit accessibility labels, screen-reader support, or formal accessibility test coverage.

# 8. Deployment and production readiness

- **Whether the application builds successfully:** Static verification is positive: `npm run lint` passed and `npx tsc --noEmit` passed during this audit. I did not run a full mobile or web production build because the repository does not define a dedicated production build script.
- **Available build/start commands:** `npm start`, `npm run ios`, `npm run android`, `npm run web`, `npm run lint`, `npm run lint:fix` (`package.json`).
- **Deployment configuration:** `app.json` contains iOS bundle ID, Android package name, web output settings, and deep-link domains. This is app platform configuration, not proof of a deployed production release.
- **Hosting provider:** Supabase is confirmed for backend services and is described by the user as fully functional for the working backend. Client hosting/distribution is not confirmed. `festnest.app` is referenced for invite/deep-link URLs but production hosting is not verified.
- **Environment requirements:** Requires at least `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; a service role key is optional and should not be in client code (`.env.example`).
- **Database setup:** SQL migrations live in `supabase/migrations/`; setup docs expect running them manually or through Supabase CLI (`docs/setup/supabase-setup.md`, `supabase/README.md`).
- **API configuration:** No separate API server exists; the app directly queries Supabase from the client (`lib/supabase.ts`, `lib/hooks/*.ts`).
- **Mobile build configuration:** iOS, Android, and web config are present in `app.json`.
- **Known blockers:** no automated tests, only lint in CI, placeholder settings/help content, forgot-password not implemented, delete-account backend not implemented, no confirmed storage bucket setup, and no confirmed release/deployment pipeline.
- **Can the project honestly be described as deployed?** Not based on repository evidence alone. It can be described as an in-progress application with a working Supabase backend, functioning auth/share/live-update flows, and simulated testing, but not as confirmed live production software.

# 9. Measurable facts

1. **31 route files under `app/`**
   - **How calculated:** `find app -type f | wc -l`
   - **Usefulness:** Indicates size of the screen/routing surface.

2. **10 trip-module route files under `app/trips/[id]`**
   - **How calculated:** `find 'app/trips/[id]' -type f | wc -l`
   - **Usefulness:** Shows scope of per-trip feature modules.

3. **38 component `.tsx` files under `components/`**
   - **How calculated:** `find components -type f -name '*.tsx' | wc -l`
   - **Usefulness:** Rough measure of reusable UI surface.

4. **12 custom hook files under `lib/hooks/`**
   - **How calculated:** `find lib/hooks -type f | wc -l`
   - **Usefulness:** Indicates custom data/state abstraction work.

5. **9 Supabase migration files**
   - **How calculated:** `find supabase/migrations -type f | wc -l`
   - **Usefulness:** Shows schema evolution beyond a single baseline migration.

6. **20 tables in the initial schema migration, plus 1 later `change_proposals` table**
   - **How calculated:** `rg '^CREATE TABLE' supabase/migrations/20260319000000_initial_schema.sql | wc -l` and same for `20260405000000_change_proposals.sql`
   - **Usefulness:** Gives a concrete database scope. Note: this conflicts with some docs that still say 17 tables.

7. **1 GitHub Actions workflow**
   - **How calculated:** `find .github/workflows -type f | wc -l`
   - **Usefulness:** CI exists but is narrow in scope.

8. **39 total local commits in repository history**
   - **How calculated:** `git rev-list --count --all`
   - **Usefulness:** Development history size.

9. **39 local commits attributable to your identity family**
   - **How calculated:** `git shortlog -sne --all`
   - **Usefulness:** Strong repository-level ownership signal. Qualification: spread across two local author strings.

10. **Development history spans 90 days from March 19, 2026 to June 16, 2026**
    - **How calculated:** first and last commit dates in local history.
    - **Usefulness:** Duration estimate for the active development window.

# 10. Skills demonstrated

## Programming languages

- **TypeScript:** `app/`, `components/`, `lib/`, `tsconfig.json`, commits `27bc14f`, `50d2f9a`.
- **SQL:** `supabase/migrations/*.sql`, especially `20260319000000_initial_schema.sql`, `20260319000001_rls_policies.sql`, `20260405000000_change_proposals.sql`.

## Front-end development

- **React Native screen and component development:** `app/trips/[id]/*.tsx`, `components/*`, commits `6fe8f38`, `5eadc18`, `50d2f9a`.
- **Navigation and route guards:** `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, commits `68c4907`, `417bc6a`.
- **Modal/form UX:** `components/Travel/*FormModal.tsx`, `components/FoodPlanner/MealEditorModal.tsx`, `components/BudgetTracker/AddExpenseModal.tsx`.

## Back-end / data-layer development

- **Direct Supabase client integration:** `lib/supabase.ts`, `lib/hooks/*.ts`.
- **Schema design and migration work:** `supabase/migrations/*.sql`, commits `27bc14f`, `bfb753c`, `bcf51f0`, `2135d71`.

## Mobile development

- **Expo app configuration:** `app.json`, `package.json`.
- **Safe-area and mobile layout hardening:** `docs/test-notes.md`, commits `2135d71`, `7cd282f`.
- **Landscape-oriented specialized screen work:** `app/trips/[id]/camp-grid.tsx`.

## Database work

- **Relational schema and RLS:** `supabase/migrations/20260319000000_initial_schema.sql`, `20260319000001_rls_policies.sql`.
- **Typed database access:** `lib/database.types.ts`.

## API integration

- **Supabase Auth, database, and realtime:** `lib/auth/AuthContext.tsx`, `lib/hooks/useTravel.ts`, `useLineup.ts`, `useSupplyList.ts`.

## Offline-first development

- **Camp Grid local-first behavior:** `lib/sqlite/useCampGridDB.ts`, commit `8fcf4b1`.
- **Safety local cache with encryption:** `lib/hooks/useSafetyProfile.ts`, `lib/sqlite/safetyDb.ts`, `lib/crypto/safetyEncryption.ts`.
- **Packing local SQLite model:** `lib/hooks/usePackingListLocal.ts`, `lib/sqlite/packingDb.ts`.

## State management

- **Custom React hooks as state/data layer:** `lib/hooks/*.ts`.

## Testing and QA

- **Manual QA process and regression tracking:** `docs/test-notes.md`, `docs/reports/*.md`, commit `7cd282f`.
- **Lint and typecheck setup:** `package.json`, `.github/workflows/lint.yml`.

## Debugging

- **Reliability fixes in travel, safety, and camp sync:** commits `c0aef1f`, `417bc6a`, `8fcf4b1`, `444f9ba`.

## Product design / UX

- **Product specs and module definitions:** `docs/product/*.md`.
- **Settings and onboarding UX decisions:** `docs/product/onboarding.md`, `docs/product/ui-decisions.md`, commits `344ac1d`, `417bc6a`.

## Technical documentation

- **Setup docs, handoffs, QA reports, session notes:** `docs/`, `supabase/README.md`, commits `4839e32`, `689e863`.

## Version control

- **Feature work across 39 attributable local commits, including 2 merge commits:** `git shortlog -sne --all`, commits `54fd7b8`, `dda53bc`.

## Deployment / release configuration

- **App platform config and deep links:** `app.json`.
- **CI lint workflow:** `.github/workflows/lint.yml`.

## Security

- **RLS:** `supabase/migrations/20260319000001_rls_policies.sql`.
- **Encryption and secure local key storage:** `lib/crypto/safetyEncryption.ts`.
- **Role-based write enforcement:** `lib/hooks/useTravel.ts`, `useCollaboration.ts`.

## Accessibility

- **Safe-area handling and notch-aware layouts:** `app/_layout.tsx`, `docs/test-notes.md`.
- **Qualification:** broader accessibility evidence is limited; do not claim formal accessibility engineering beyond safe-area/mobile layout care.

# 11. Resume-ready project facts

427. **Ready — Expo/React Native app:** Designed and shipped a cross-platform Expo/React Native app with 31 route files and trip-based module navigation. **Evidence:** `app/`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`. **Limitation:** Implementation was agent-assisted; mobile is the primary experience.

428. **Ready — Working Supabase backend:** Built a working Supabase-backed system for auth, relational data, RLS, and realtime subscriptions across travel, lineup, supplies, food, budget, activity, and collaboration flows. **Evidence:** `lib/supabase.ts`, `lib/hooks/*.ts`, `supabase/migrations/*.sql`. **Limitation:** No separate custom API service is present.

429. **Ready — Trip creation and invite flow:** Implemented trip creation, invite code generation, deep-linkable join pages, and membership creation. **Evidence:** `app/trips/create.tsx`, `app/join/[code].tsx`, `lib/invites/invite-utils.ts`. **Limitation:** Invite expiry exists in code but is not fully surfaced in UI.

430. **Ready — Offline camp planning:** Implemented an offline-first camp layout planner backed by local SQLite with manual sync to shared Supabase state. **Evidence:** `app/trips/[id]/camp-grid.tsx`, `lib/sqlite/useCampGridDB.ts`, `lib/sqlite/db.ts`. **Limitation:** Collision detection and PNG export are still planned.

431. **Ready — Sync safety guardrails:** Added camp-grid save protections that block destructive overwrites when remote state cannot be verified. **Evidence:** `lib/sqlite/useCampGridDB.ts`, commit `8fcf4b1`, `docs/test-notes.md`. **Limitation:** This is reliability work, not a new end-user feature.

432. **Ready — Encrypted safety profiles:** Implemented encrypted safety/emergency profiles with device-stored keys, local SQLite cache, and PIN-gated emergency access support. **Evidence:** `lib/crypto/safetyEncryption.ts`, `lib/hooks/useSafetyProfile.ts`, `lib/sqlite/safetyDb.ts`. **Limitation:** This is client-side encryption logic; do not claim independently audited security.

433. **Ready — Supply coordination:** Built a shared supply list with CRUD, claim/unclaim workflow, packed state, category grouping, duplicate detection, and activity logging. **Evidence:** `app/trips/[id]/supply-list.tsx`, `lib/hooks/useSupplyList.ts`, `components/SupplyList/*`. **Limitation:** Personal ownership is supported by repo history, but file-level sole authorship was not checked line by line.

434. **Ready — Travel coordination:** Implemented travel planning for vehicles, passengers, flights, and a shared meetup pin map. **Evidence:** `app/trips/[id]/travel.tsx`, `components/Travel/*`, `lib/hooks/useTravel.ts`. **Limitation:** Multi-pin mapping and richer route visualization are not built.

435. **Ready — Role-based travel permissions:** Enforced read-only access for viewers in travel UI and mutation paths. **Evidence:** `lib/hooks/useTravel.ts`, commit `c0aef1f`, `docs/test-notes.md`. **Limitation:** Verified for Travel only, not as a universal permission abstraction.

436. **Ready — Meal planning tied to supply data:** Added a day-by-day meal planner with ingredient lists, dietary flags, cook assignment, duplication, and supply-list ingredient sync. **Evidence:** `app/trips/[id]/food-planner.tsx`, `lib/hooks/useFoodPlanner.ts`. **Limitation:** Some workflow polish remains in docs.

437. **Ready — Lineup voting logic:** Built artist voting, consensus calculation, conflict detection, and preset artist import for supported festivals. **Evidence:** `app/trips/[id]/lineup.tsx`, `lib/hooks/useLineup.ts`, `lib/lineupFestivalArtists.ts`. **Limitation:** Automatic lineup import from external sources is not confirmed.

438. **Ready — Packing checklist with local persistence:** Implemented packing lists stored locally in SQLite, with starter templates and sync from claimed supply items. **Evidence:** `app/trips/[id]/packing-checklist.tsx`, `lib/hooks/usePackingListLocal.ts`, `lib/sqlite/packingDb.ts`. **Limitation:** This module is local-first rather than cloud-synced.

439. **Ready — Shared budget logic:** Added shared expense tracking with equal/custom splits and derived settle-up calculations. **Evidence:** `app/trips/[id]/budget.tsx`, `lib/hooks/useBudgetTracker.ts`. **Limitation:** Receipt-photo handling is documented but not confirmed as active.

440. **Ready — Cross-trip activity feed:** Implemented a user-level activity feed that groups recent actions across trips and routes back into trip dashboards. **Evidence:** `app/(tabs)/activity.tsx`, `lib/hooks/useActivityFeed.ts`. **Limitation:** No analytics or retention metrics are present.

441. **Confirm — Approval queue backend groundwork:** Added a `change_proposals` table, RLS, realtime hook, and collaboration queue UI. **Evidence:** `supabase/migrations/20260405000000_change_proposals.sql`, `lib/hooks/useApprovalQueue.ts`, `app/trips/[id]/collaboration.tsx`. **Limitation:** No evidence that the rest of the app actively creates or resolves proposals through UI flows.

442. **Ready — Schema and RLS design:** Defined a multi-table Supabase schema with trip-scoped access control, self-owned safety data rules, and role-based editing policies. **Evidence:** `supabase/migrations/20260319000000_initial_schema.sql`, `20260319000001_rls_policies.sql`. **Limitation:** Docs still mention 17 tables, while the initial migration creates 20.

443. **Ready — Static quality checks:** Added linting and confirmed local lint/typecheck pass. **Evidence:** `package.json`, `.github/workflows/lint.yml`, local audit run of `npm run lint` and `npx tsc --noEmit`. **Limitation:** No formal test suite or coverage report exists.

444. **Ready — Product and QA documentation:** Wrote or maintained extensive product specs, setup guides, handoff notes, and manual QA reports. **Evidence:** `docs/`, `supabase/README.md`, commits `4839e32`, `689e863`. **Limitation:** Documentation includes planning items alongside shipped work, so each claim should still be cross-checked against code.

445. **Ready — Technical direction and agent orchestration:** Repository history plus user clarification support describing this as your original product idea and plan, implemented largely through coding agents under your direction. **Evidence:** `git shortlog -sne --all`, user clarification on July 10, 2026. **Limitation:** Do not claim sole manual authorship of all implementation files.

446. **Do not use — Production deployment claim:** The repo references `festnest.app` for invite links and deep links, but there is no confirmed deployment pipeline or release proof in the repository. **Evidence:** `app.json`, `lib/invites/invite-utils.ts`. **Limitation:** Do not say the app is live in production unless you can verify it separately.

# 12. Best resume positioning

## Strongest facts for an AI evaluation or AI quality resume

1. Offline-first camp-grid sync with destructive-overwrite protection (`lib/sqlite/useCampGridDB.ts`, commit `8fcf4b1`).
2. Encrypted safety profile system using device-stored keys, local cache, and PIN-based emergency access (`lib/crypto/safetyEncryption.ts`, `lib/hooks/useSafetyProfile.ts`).
3. Original product planning plus agent-directed implementation of a working Supabase-backed mobile app with live collaboration flows (user clarification, `lib/hooks/*.ts`, `app/trips/create.tsx`, `app/join/[code].tsx`).

## Strongest facts for a general software or technical QA resume

1. Built and evolved a cross-platform mobile app with 31 routed screens and multiple collaborative planning modules (`app/`).
2. Designed and maintained a relational database with RLS policies and 9 migrations (`supabase/migrations/*.sql`).
3. Drove QA remediation using documented audits, lint gating, and targeted reliability fixes in a simulated test environment (`docs/test-notes.md`, commit `7cd282f`, commit `c0aef1f`).

## Strongest facts for a junior software engineering resume

1. Implemented end-to-end user flows for auth, trip creation, invites, and join-by-link (`app/auth/*.tsx`, `app/trips/create.tsx`, `app/join/[code].tsx`).
2. Built reusable React Native components and hooks for supply, travel, food, lineup, safety, and budget features (`components/*`, `lib/hooks/*`).
3. Directed agent-assisted implementation of local persistence and realtime shared data handling using Expo SQLite and Supabase (`lib/sqlite/*`, `lib/hooks/*`).

## Claims that should not appear on a resume

- “Deployed live production app” or “production mobile app” without separate deployment verification.
- “Built push notifications” because only settings scaffolding exists.
- “Implemented weather integration,” “mesh networking,” or “live festival mode.”
- “Created a full automated test suite” or “achieved test coverage” because that evidence is absent.
- “Built full collaboration approval workflow” without qualifying it as partial groundwork.
- “Implemented delete account flow” because the backend destruction path is explicitly missing.
- “Manually coded the entire app yourself” because your clarification says most implementation was done through agents you directed.

## Questions you need to answer before the project can be described accurately

1. Did `festnest.app` actually go live, or is it only a configured deep-link domain?
2. Which modules do you want to foreground as your strongest examples of planning, technical direction, and review of agent-generated code?
3. Were any external lineup import sources, storage buckets, or notification services ever connected outside this repository?
4. If you apply to environment/simulation roles, do you want this framed as an app build or as an environment-style reconstruction with agent-directed implementation?
5. Which resume target matters most: environment engineering for AI training, product/mobile engineering, QA/reliability, or full-stack app development?
