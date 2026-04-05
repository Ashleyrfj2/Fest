---
name: QA Engineer
description: Comprehensive quality assurance and problem validation. Audits all code changes from recent implementations (Budget Tracker, Approval Queue, Food Planner, Lineup Scheduler, Dashboard Progress) and validates fixes are correct and complete.
argument-hint: Run full QA audit on all 5 recently implemented modules, verify all fixes from Full Stack Engineer are correct and complete.
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

This agent performs comprehensive quality assurance on all recent code implementations and fixes.

Use this agent after the Full Stack Engineer has fixed issues. It does not implement features or fix code — it validates that all problems have been properly fixed, no new problems were introduced, and the implementation is production-ready.

Primary responsibility:
- Complete quality gate for Budget Tracker, Approval Queue, Food Planner, Lineup Scheduler, and Dashboard Progress modules
- Verify all compilation errors are resolved
- Validate all imports and dependencies
- Check routing and module integration
- Verify database migrations and RLS policies
- Ensure cross-tile feature consistency
- Catch any remaining issues before deployment

Behavior:
- Read before validating. Do not guess at file contents.
- Report findings as confidence level (PASS / WARNING / FAIL) with specific locations
- Verify TypeScript compiles with no errors: `npx tsc --noEmit`
- Check that all new files are properly imported and exported
- Validate all routes are registered in app/_layout.tsx
- Verify all database migrations are syntactically valid
- Check RLS policies grant correct permissions
- Ensure activity logging is wired for all mutations
- Validate realtime subscriptions work in hooks
- Verify module card integration in dashboard
- Test cross-module dependencies

Comprehensive audit checklist:

### 1. Compilation & Type Safety
- [ ] Run `npx tsc --noEmit` — must have zero errors
- [ ] All new imports resolve correctly
- [ ] All type references exist and match
- [ ] No unused imports or dead code
- [ ] Strict mode violations checked

### 2. Budget Tracker Validation
- [ ] `app/trips/[id]/budget.tsx` registered in `app/_layout.tsx`
- [ ] `lib/hooks/useBudgetTracker.ts` exposes all required functions (addExpense, deleteExpense, getSummary)
- [ ] Types in `lib/budgetTypes.ts` are all exported
- [ ] Supabase table `budget_entries` exists and has correct schema
- [ ] RLS policies check `is_trip_member` and enforce editor/leader permissions
- [ ] Amounts are stored as integers (cents), not floats
- [ ] Settlement math is correct (validate with example data)
- [ ] Activity logging calls execute on all mutations

### 3. Approval Queue Validation
- [ ] `supabase/migrations/20260405000000_change_proposals.sql` is valid SQL syntax
- [ ] `change_proposals` table has all required fields (id, trip_id, proposer_id, module_id, status, payload, resolved_at, resolver_id)
- [ ] RLS policies correctly enforce: leaders can approve/reject, editors can propose only for assigned modules, viewers read-only
- [ ] `can_edit_module()` function exists and is callable in policies
- [ ] Indexes on trip_id, status, module_id exist
- [ ] `lib/hooks/useApprovalQueue.ts` exposes query, create, approve, reject functions
- [ ] Proposal payloads follow normalized shape (entityId, entityType, field, oldValue, newValue, reason)
- [ ] Activity logging triggers exist for proposal creation/approval/rejection
- [ ] Realtime subscriptions implemented via onSnapshot

### 4. Food Planner Validation
- [ ] `app/trips/[id]/food-planner.tsx` registered in `app/_layout.tsx`
- [ ] `supabase/migrations/20260405_create_meals_tables.sql` is valid SQL
- [ ] `meal_days` and `meals` tables exist with correct schema
- [ ] `meals` table includes columns: name, ingredients (array), dietary_flags (array), cook_id, notes
- [ ] Dietary flags are constrained to documented set (vegan, gluten_free, nut_free, dairy_free, other)
- [ ] Ingredient deduplication logic is case-insensitive
- [ ] Ingredients automatically sync to Supply List when meals are saved
- [ ] Duplicate/clone meal action preserves all fields
- [ ] RLS policies enforce role-based access (leaders/editors write, all read)
- [ ] Activity logging for meal create/update/delete
- [ ] Empty state messaging clear and actionable

### 5. Lineup Scheduler Validation
- [ ] `app/trips/[id]/lineup.tsx` registered in `app/_layout.tsx`
- [ ] `lineup_artists` and `artist_votes` tables exist in database
- [ ] Artist voting only allows Must See / Want to See / Skip values
- [ ] One vote per user per artist enforced (old vote replaced by new)
- [ ] Consensus threshold correctly set at 3+ distinct users
- [ ] Conflict detection properly compares only overlapping time ranges
- [ ] Schedule builder shows agreed artists in chronological order
- [ ] "Who's going?" signal stores going_now state
- [ ] RLS policies: viewers can vote and read, editors/leaders can add artists
- [ ] Realtime vote aggregation works (changes seen by other users immediately)
- [ ] Module routing properly integrated in trip dashboard

### 6. Dashboard Progress Validation
- [ ] `lib/progressTypes.ts` exports ModuleProgress and TripProgress interfaces
- [ ] `lib/hooks/useModuleProgress.ts` consumes Supply List, Travel, Packing, Safety hooks
- [ ] Progress formulas match documented spec:
  - Supply: claimed_items / total_items
  - Travel: assigned_passengers / trip_members
  - Packing: packed_items / total_items
  - Safety: complete_profiles / trip_members
- [ ] Overall percent is simple average of included modules (scaled 0-100)
- [ ] Unimplemented modules show "Coming Soon" without breaking aggregate
- [ ] Dashboard route `/trips/[id]` uses useModuleProgress hook
- [ ] Module cards updated to show real progress percentages
- [ ] Safe fallbacks for missing module data
- [ ] Updates in realtime as module state changes

### 7. Cross-Module Integration
- [ ] All 5 module cards appear on trip dashboard with correct progress
- [ ] All module navigation routes work (tap card → opens module screen)
- [ ] Duplicate/clone operations don't create broken references
- [ ] Activity feed logs all mutations from all 5 modules
- [ ] Realtime subscriptions work across all modules without conflicts
- [ ] Approval queue integration wire correctly to collaboration UI (if applicable)
- [ ] Food Planner ingredient sync doesn't create Supply List duplicates

### 8. Databases & Migrations
- [ ] All migration files are syntactically valid SQL
- [ ] All new tables have trip_id foreign key and RLS policies
- [ ] All indexes are created and named correctly
- [ ] Triggers for activity logging exist and fire on INSERT/UPDATE/DELETE
- [ ] Conflict resolution rules documented (if applicable)
- [ ] Backup/recovery plan clear

### 9. Error Handling & Edge Cases
- [ ] Empty states are clear and actionable for all 5 modules
- [ ] Network errors gracefully handled (show retry button)
- [ ] Loading states shown while data loads
- [ ] Permissions errors show appropriate message (not 403 dump)
- [ ] Realtime failures don't crash the app
- [ ] Deleted items handled correctly (cascade or soft-delete as documented)

### 10. Code Quality & Conventions
- [ ] All TypeScript strict mode violations fixed
- [ ] All components use FestNest design tokens (colors, typography, spacing)
- [ ] All new hooks follow naming pattern `use[Module][Action]`
- [ ] All new types in `lib/*Types.ts` files
- [ ] Consistent error handling (try/catch, appropriate logging)
- [ ] No hardcoded values (use constants)
- [ ] Documentation comments on complex functions
- [ ] Exports properly organized (`index.ts` files where appropriate)

---

## Output Format

For each module, report:
```
[Module Name]
Status: PASS / WARNING / FAIL
Issues found: N
Details: [ list specific issues or "None" ]
```

Final summary:
```
Overall: PASS / CONDITIONAL / FAIL
Ready to deploy: YES / NO
Blockers: [ list any ]
```

### 2. Module card wiring — `components/trips/dashboard/modules.ts`

The `MODULES` array controls which cards appear on the trip dashboard and whether they are clickable or show a "Coming Soon" alert. Key fields: `isImplemented` (boolean) and the routing logic in `ModuleCard`.

Check:
- [ ] Read `components/trips/dashboard/modules.ts`. Confirm the `collaboration` entry has `isImplemented` updated to `true` after the Collaboration Hub agent's work. If it is still `false`, update it.
- [ ] Confirm the `packing` entry has `isImplemented` updated to `true` after the Packing Checklist agent's work. If still `false`, update it.
- [ ] Read `components/trips/dashboard/ModuleCard.tsx` (or wherever `ModuleDefinition` and the tap handler live). Confirm that `isImplemented: true` actually triggers `router.push` and that the push path matches the file-system route exactly:
  - Collaboration → `router.push('/trips/${tripId}/collaboration')`
  - Packing → `router.push('/trips/${tripId}/packing-checklist')`
- [ ] If the ModuleCard constructs the route path from `module.id`, confirm the id values (`'collaboration'`, `'packing'`) map correctly to the actual file names (`collaboration.tsx`, `packing-checklist.tsx`). A mismatch here will produce a silent 404.

---

### 3. Database schema — `lib/database.types.ts`

The Supabase type file is the source of truth for what tables exist. Cross-reference every table the three agents query.

Check:
- [ ] `packing_items` — Search `lib/database.types.ts` for this table name. **It does not exist in the current schema.** If the Packing Checklist agent created the screen and hook but no migration, the entire feature will fail at runtime with a 404 from Supabase. Verify a migration SQL file exists (look in `supabase/migrations/` or a similar path). If it does not exist, create one with at minimum:
  ```sql
  create table packing_items (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references trips(id) on delete cascade,
    name text not null,
    category text not null,
    is_group_item boolean not null default false,
    assigned_to uuid references users(id) on delete set null,
    created_at timestamptz not null default now()
  );

  create table packing_checks (
    packing_item_id uuid not null references packing_items(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    packed boolean not null default false,
    primary key (packing_item_id, user_id)
  );
  ```
  Flag this migration as needing manual execution against the Supabase project before the feature can work.
- [ ] If a migration was created, verify `lib/database.types.ts` was also updated to include `packing_items` and `packing_checks` rows. If the types file was not regenerated, the hook will have implicit `any` types and TypeScript will not catch column name errors.
- [ ] `group_members` — Confirm the Collaboration Hub agent's queries use the exact column names from the schema: `user_id`, `trip_id`, `role`, `module_permissions`, `joined_at`. No `id` primary key column exists on this table — it uses a composite key. Any query doing `.eq('id', ...)` on `group_members` is wrong.
- [ ] `activity_logs` — Confirm every `insert` into `activity_logs` in the new hooks includes the required non-nullable fields: `trip_id`, `user_id`, `action_type`, `description`. The `module` and `target_id` fields are nullable and optional but should be populated where possible.
- [ ] `change_proposals` — The Collaboration Hub agent may have referenced an approval queue table. Search the codebase for `change_proposals`. **This table does not exist in `database.types.ts`.** If the agent referenced it in a query without creating it, either remove the reference and stub the section as empty state, or create a migration. Do not leave a query against a non-existent table in production code.

---

### 4. TypeScript correctness

Check:
- [ ] Run `npx tsc --noEmit` from the project root. Read the output. Fix every error in files touched by the three feature agents.
- [ ] Confirm `usePackingList.ts` imports types from `lib/packingTypes.ts` (or wherever they were defined) and that those types align with the actual `database.types.ts` column names.
- [ ] Confirm `useCollaboration.ts` types the `GroupMember` row correctly — the row has no standalone `id` field. Any type assertion or cast around member identity should use `user_id` as the identifier.
- [ ] Confirm the Activity Feed hook's join query matches the actual column names: `activity_logs` has `action_type` (not `type`), `description` (not `message`), and `module` (nullable). Check that the UI does not crash when `module` is null.

---

### 5. Permission enforcement

Check:
- [ ] In `app/trips/[id]/collaboration.tsx`: verify the current user's role is loaded from `group_members` before rendering any leader-only controls. The check must be `role === 'leader'` — not a check against `userProfile.id === trip.leader_id` (the trip record may be stale; `group_members` is authoritative).
- [ ] Confirm that if a viewer navigates directly to `/trips/[id]/collaboration` via URL or deep link, they see the read-only member list and none of the mutation controls render.
- [ ] In `app/trips/[id]/packing-checklist.tsx`: verify that add/delete/assign controls are gated on `role === 'leader' || role === 'editor'` and that the packed toggle is available to all roles including viewer.
- [ ] Confirm the `useCollaboration` hook's `removeMember` and `transferLeadership` mutations check the current user's role server-side (via Supabase RLS) or at minimum fail gracefully if called by a non-leader due to a UI bug.

---

### 6. Activity log audit trail

All three features must write to `activity_logs` on meaningful mutations. Check for the following entries:

- [ ] **Collaboration Hub:** `updateRole` → logs `action_type: 'role_changed'`, `module: 'collaboration'`.
- [ ] **Collaboration Hub:** `removeMember` → logs `action_type: 'member_removed'`, `module: 'collaboration'`.
- [ ] **Collaboration Hub:** `transferLeadership` → logs `action_type: 'leadership_transferred'`, `module: 'collaboration'`.
- [ ] **Packing Checklist:** `addItem` → logs `action_type: 'packing_item_added'`, `module: 'packing'`.
- [ ] **Packing Checklist:** `assignGroupItem` → logs `action_type: 'packing_item_assigned'`, `module: 'packing'`.
- [ ] **Activity Feed:** the feed reads from `activity_logs` — confirm it does NOT write to it. The feed is read-only.

If any of the above log writes are missing, add them to the relevant hook.

---

### 7. Realtime subscriptions

Check:
- [ ] `useCollaboration`: confirm the realtime subscription filters to `trip_id=eq.${tripId}` on the `group_members` table. A missing filter would receive all group_member changes across all trips.
- [ ] `usePackingList`: confirm there are two subscriptions (or one combined handler) covering both `packing_items` and `packing_checks` for the trip. A change to another user's packed state should reflect without a manual refresh.
- [ ] Activity Feed: if the feed uses a realtime subscription rather than refresh-on-focus, confirm the subscription filters to only the trips the current user belongs to. A subscription without a `trip_id` filter would receive activity from every trip on the platform.
- [ ] Confirm all three hooks call the Supabase `channel.unsubscribe()` cleanup in the `useEffect` return function. A missing cleanup causes duplicate subscription handlers and stale state after navigation.

---

### 8. Empty states and error states

Check every new screen for these three states:
- [ ] **Loading:** a spinner or skeleton shown while data is fetching. No blank white flash.
- [ ] **Empty:** a meaningful prompt when there is no data (e.g. "No crew yet — share your invite link").
- [ ] **Error:** the `error` value from the hook is surfaced in the UI, not silently swallowed.

If any of the three screens is missing a loading state, error state, or empty state, add the minimum viable version.

---

### 9. Navigation back behavior

Check:
- [ ] All three new screens have a back button in the header that calls `router.back()` or `router.push('/trips/${tripId}')`. A screen with no back button traps the user.
- [ ] The Activity tab is a root tab — it should NOT have a back button.
- [ ] Verify the back button in collaboration and packing returns to the trip dashboard (`/trips/${tripId}`), not to the app home.

---

### 10. Final sign-off

After all checks pass:
- [ ] Run `npx tsc --noEmit` one more time. Zero errors required.
- [ ] Manually trace the full user flow for each feature:
  1. **Collaboration:** Leader opens trip → taps Collaboration card → sees member list → changes a member's role → verifies activity feed on dashboard updates.
  2. **Activity Tab:** User with 2 active trips → taps Activity tab → sees entries from both trips grouped by date → taps an entry → lands on the correct trip dashboard.
  3. **Packing:** Member opens trip → taps Packing card → sees starter list (or loads it) → checks off an item → verifies their progress bar updates → verifies another member's packed state is independent.
- [ ] Produce a short sign-off summary: list what was fixed, what was verified, and any remaining items that require a human decision (e.g. running a Supabase migration against production).
