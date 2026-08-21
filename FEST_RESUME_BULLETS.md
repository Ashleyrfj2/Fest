# Resume Bullets from FestNest

These bullets are intentionally plain, evidence-grounded, and written to be edited into a resume. They avoid claiming sole manual authorship of all code.

## Environment Engineer / AI Systems Angle

1. Designed the concept, module structure, and technical plan for a group trip-planning mobile app, then directed agent-assisted implementation across client UX, Supabase schema, auth, realtime data, and offline storage layers.  
Evidence: `docs/product/*.md`, `app/`, `lib/hooks/*.ts`, `supabase/migrations/*.sql`

2. Built a working Supabase-backed shared-state system with authentication, invite links, role-based permissions, row-level security, and realtime updates across travel, lineup, supply, food, budget, and activity modules.  
Evidence: `lib/supabase.ts`, `lib/auth/AuthContext.tsx`, `lib/hooks/*.ts`, `supabase/migrations/20260319000001_rls_policies.sql`

3. Designed offline-capable flows for camp layout, safety data, and packing lists using local SQLite storage, with sync logic to shared backend state when appropriate.  
Evidence: `lib/sqlite/useCampGridDB.ts`, `lib/sqlite/safetyDb.ts`, `lib/sqlite/packingDb.ts`, `lib/hooks/usePackingListLocal.ts`

4. Hardened system invariants around destructive sync behavior, safety-profile encryption, and emergency-PIN recovery flows, including fixes for stale-cache and missing-local-row edge cases.  
Evidence: `lib/sqlite/useCampGridDB.ts`, `lib/hooks/useSafetyProfile.ts`, `docs/test-notes.md`, commits `8fcf4b1`, `417bc6a`, `444f9ba`

5. Used coding agents as implementation leverage while retaining ownership of architecture, debugging, QA review, and deciding whether failures came from environment design, sync logic, or generated code.  
Evidence: user clarification, `.github/agents/`, `docs/handoffs/*.md`, `docs/test-notes.md`

6. Maintained a realistic relational backend with 9 migrations, role-aware collaboration rules, and schema support for multi-step planning workflows rather than isolated screens.  
Evidence: `supabase/migrations/*.sql`

## Software Engineering Angle

7. Implemented end-to-end auth and onboarding flows for anonymous guest accounts, email registration, sign-in, profile setup, and guest-to-email upgrade using Supabase Auth and Expo Router.  
Evidence: `lib/auth/AuthContext.tsx`, `app/auth/*.tsx`, `app/onboarding/set-profile.tsx`

8. Implemented trip creation, invite-code generation, deep-link join pages, and group membership creation backed by Supabase tables and activity logs.  
Evidence: `app/trips/create.tsx`, `app/join/[code].tsx`, `lib/invites/invite-utils.ts`

9. Built a collaborative travel-planning module for vehicles, passengers, flights, and meetup coordination, including map-based meetup pins and viewer write restrictions.  
Evidence: `app/trips/[id]/travel.tsx`, `components/Travel/*`, `lib/hooks/useTravel.ts`

10. Built a shared supply-list workflow with item CRUD, claim/unclaim behavior, packed-state tracking, duplicate detection, and realtime updates.  
Evidence: `app/trips/[id]/supply-list.tsx`, `components/SupplyList/*`, `lib/hooks/useSupplyList.ts`

11. Built a meal-planning workflow with day/slot scheduling, dietary flags, cook assignment, meal duplication, and ingredient sync into the supply list.  
Evidence: `app/trips/[id]/food-planner.tsx`, `components/FoodPlanner/*`, `lib/hooks/useFoodPlanner.ts`

12. Built a lineup scheduler with per-user artist voting, consensus calculations, conflict detection, and preset artist import for supported festivals.  
Evidence: `app/trips/[id]/lineup.tsx`, `lib/hooks/useLineup.ts`, `lib/lineupFestivalArtists.ts`

13. Built a budget tracker with equal/custom split logic and derived settle-up calculations across group members.  
Evidence: `app/trips/[id]/budget.tsx`, `lib/hooks/useBudgetTracker.ts`

14. Built a packing-checklist system with seeded starter templates, local per-user state, and sync from claimed supply items.  
Evidence: `app/trips/[id]/packing-checklist.tsx`, `lib/sqlite/packingDb.ts`, `lib/hooks/usePackingListLocal.ts`

15. Built an offline-first camp-grid planner with snap-to-grid placement, local persistence, and explicit save-to-group behavior.  
Evidence: `app/trips/[id]/camp-grid.tsx`, `components/CampGrid/*`, `lib/sqlite/useCampGridDB.ts`

16. Built encrypted safety-profile flows with device-stored keys, local SQLite cache, and PIN-gated emergency access handling.  
Evidence: `lib/crypto/safetyEncryption.ts`, `lib/hooks/useSafetyProfile.ts`, `lib/sqlite/safetyDb.ts`

## QA / Reliability Angle

17. Added linting and CI checks and verified the project passes local lint and TypeScript checks.  
Evidence: `package.json`, `.github/workflows/lint.yml`

18. Documented and resolved high-risk bugs in sync safety, role enforcement, safe-area layout behavior, and safety-data recovery through repeated manual QA cycles.  
Evidence: `docs/test-notes.md`, `docs/reports/*.md`, commits `7cd282f`, `c0aef1f`, `8fcf4b1`

19. Used detailed QA notes and handoff documents to track implemented work separately from deferred or planned features.  
Evidence: `docs/test-notes.md`, `docs/product/feature-completion.md`, `docs/handoffs/*.md`

## Shorter versions

20. Designed and directed an agent-assisted mobile app with Supabase auth, realtime collaboration, offline SQLite modules, and encrypted safety data.  

21. Built a working shared-state backend with role-based access, invite links, live updates, and offline-capable planning flows.  

22. Hardened sync and security edge cases in offline/shared modules, including destructive-save blocking and safety-PIN recovery logic.  

## Bullets to avoid

- Avoid: “Built a live production app” unless you separately verify deployment.
- Avoid: “Built push notifications” because only settings scaffolding exists.
- Avoid: “Built the entire app by hand” because your clarified process was heavily agent-assisted.
