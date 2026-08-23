# Test Notes

Use this file to capture things you want to add, adjust, or fix while testing the app.

## Outstanding Issues

### Session Update (August 22, 2026 - Gate 3 Stale Proxy Composed With The Live Two-Session Test)
- Baseline taken first on `main` at `525e121`, since no receipt covered the stale-proxy code already merged there: lint PASS, `tsc --noEmit` PASS, 43 of 43 deterministic tests PASS, 2 of 2 proxy mock tests PASS. Nothing was pre-broken.
- Fixed the composition gap, not the proxy: `scripts/demo/run-equipment-test.sh` now launches `stale-proxy.mjs`, waits for it, and points `EXPO_PUBLIC_SUPABASE_URL` at it; `tests/demo/equipment-handoff.spec.ts` now fails closed if it is not running through the proxy, so this cannot silently regress.
- Verified composed two-session isolation against live local Supabase, twice from a fresh seed: the concurrent `editor-a` session read `packed` while the arming session read `claimed` in the same concurrent pair, the arming session recovered to `packed` on its next read, and the database was never stale.
- Proxy event log shows exactly one activation, one stale response served, and one `delivered` deactivation, all on the arming session's selector; no event carried the concurrent session's selector and no token material was logged.
- Negative control: bypassing the proxy fails the run at the stale assertion with `packed` instead of `claimed`, so the assertion is not vacuous.
- Reset fingerprints before and after both match canonical `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- Not verified: browser/realtime composition (the 4173 export and `playwright.live-demo.config.ts` were not run), adapter reconciliation of stale evidence, and the Demo-side verification-request half. The running `demo-api-1` image predates the Gate 2/Gate 3 routes; only `/api/v1/events` was exercised.
- `BUG-20260822-006` stays **In progress** and Festival-owned under canonical Demo `CURRENT.md`. This is not Gate 3 acceptance or composed-workflow readiness, and `BLOCK-20260822-001` stays blocked. Full receipt: `docs/sessions/session-notes-2026-08-22.md`.

### Session Update (August 22, 2026 - Branch Reality Corrected)
- Supersedes the branch statement in the block below. Festival `next3` was merged and deleted; `main` is `14df183` (`Next3 (#6)`) and carries the scoped stale proxy and the Gate 1 supply-mutation migration. Branch new Festival work from `main`.
- The merge missed local commit `1f05ea8`, so the 20:01 and 20:12 session notes were absent from `main`. This change restores them unchanged.
- Sibling Demo is the opposite: its `next3` is **not** merged, and Demo `main` lacks the Gate 2/Gate 3 code until Demo PR #4 lands. Demo's suite was briefly red from a `search_path` pin in its `0005` migration; that is fixed and green, and `BUG-20260822-004` is **Implemented — awaiting verification**.
- Before the proxy composition task, establish a lint/typecheck/deterministic-test baseline. No current receipt covers the proxy code now on `main`.

### Session Update (August 22, 2026 - Unlogged `next3` Implementation Reconciled)
- Branch reference below is superseded by the block above. Despite its documentation-only commit message, `740dbc1` also carries the Gate 1 supply-mutation work and previously unlogged Gate 3 stale-proxy scoping.
- The stale proxy is now scoped to one actor, session, credential digest, and exact canonicalized query with a fail-open TTL, covered by isolated mock tests.
- Still open: the live two-session equipment test targets Supabase directly and `run-equipment-test.sh` never launches the proxy, so the composed stale condition is unwired. `BUG-20260822-006` is **In progress** under canonical Demo `CURRENT.md`; do not mint a Festival-specific ID for it.
- Read-only reconciliation. No lint, typecheck, test, reset, seed, or browser run was performed. See the dated session note for the full receipt.

### Session Update (August 22, 2026 - Gate 1 Documentation Synchronized)
- Current local setup, testing, feature-status, Supply List, handoff-index, and user-audit documentation now matches the accepted Gate 1 database-authoritative behavior.
- The normative runbook identifies `late-tester-d` as editor, preserves `viewer-b` as the denial actor, and uses the guarded reset wrapper. The sibling Demo tutorial is explicitly historical and portable.
- Documentation scans and cross-repository runbook byte-equality passed; the exact final hash and both whitespace receipts are in the dated session note.
- Gate 2, Gate 3, the composed workflow, human runs, and public onboarding remain pending or blocked under canonical Demo `CURRENT.md`. No implementation/runtime state was changed by this documentation pass.

### Session Update (August 22, 2026 - Gate 1 Evidence Authority Accepted)
- Closed and verified `BUG-20260822-003`: builds are explicitly registered in an immutable order; unknown builds fail closed; delayed old-build evidence cannot become current or stale newer evidence.
- Closed and verified `BUG-20260822-005`: permission denials now originate in immutable private database audits and normalize through the authenticated adapter with deterministic IDs.
- Closed and verified `BUG-20260822-008`: Supply List transitions use database RPC ownership/state checks; only leaders/editors delete; direct authenticated workflow-column mutation is unavailable.
- Accepted checks: Demo unit/PostgreSQL/conformance PASS; Festival lint/typecheck/43 tests PASS; local reset/migrate/seed PASS; live equipment test PASS 1/1; four audits reconciled to exactly four authoritative Demo events; final canonical reset and both diff checks PASS.
- The adapter now requires `FESTNEST_EXPERIMENT_RUN_ID`. Gate 2 run/metric lifecycle and Gate 3 stale/extension/composed validation remain pending.
- This focused Gate 1 receipt is not overall experiment readiness. Human baseline/guided work remains blocked until Bugs 001–008 are closed and the fresh composed workflow gate passes; public onboarding has its separate history-remediation blocker.

### Session Update (August 22, 2026 - Festival PR Merged)
- Festival PR #4 passed its complete GitHub workflow and was squash-merged to Festival `main` as `4479bde`.
- Demo PR #2 remains merged to Demo `main` as `af9ac0b`; both implementation feature branches were deleted remotely.
- The merge publishes the verified integrity milestones but does not close the remaining audit items or authorize the empirical study.

### Session Update (August 22, 2026 - Demo PR Merged, Festival Revalidated)
- Demo PR #2 passed its post-rebase CI runs and was squash-merged to Demo `main` as `af9ac0b`.
- Fresh Festival validation passed: ESLint, TypeScript `--noEmit`, and all 41 deterministic tests.
- Fresh cross-repository validation passed: Demo contract conformance and byte-identical normative runbooks.
- The authenticated Playwright/activity-adapter runtime was not rerun during publication; preserve its earlier receipt without relabeling it as post-merge validation.
- Festival PR #4 remains limited by the documented open audit items and the trusted/offline-network requirement.

### Session Update (August 22, 2026 - Evidence Integrity Milestones 1–3)
- Closed and verified `BUG-20260822-001`: Demo raw ingest and derived projections now roll back or commit together; injected failure leaves no partial rows and retry succeeds.
- Closed and verified `BUG-20260822-002`: corrections reject self/cross-scope misuse, persist an append-only scoped audit, survive restart, and govern later evidence identity.
- Added authenticated source identity and `409` payload-conflict behavior; stable Festival actors now cross the adapter boundary instead of generated user UUIDs.
- Added PostgreSQL failure/restart/concurrency/correction-chain tests plus JSON Schema/OpenAPI/Go/TypeScript/fixture conformance CI.
- Verified: Demo PostgreSQL suite twice, frontend/extension builds, live `200/401/200` health/auth behavior, Festival lint/typecheck/41 tests, authenticated equipment-handoff Playwright test, and final canonical seed fingerprint.
- Verified the Festival activity adapter posted four authenticated stable-actor events after the handoff; the final Festival reset restored the canonical seed.
- Remaining: explicit build-recency semantics, authoritative permission-denial provenance, metrics freeze, actor-scoped stale proxy, extension reliability, and Supply List authorization hardening.
- Containment limit: Demo ports are loopback-only. Festival Supabase remains all-interface on this Docker Desktop runtime; use a trusted/offline network for this private recording.
- Canonical statuses: sibling Demo `docs/agent-logs/CURRENT.md`; detailed Festival handoff: `docs/sessions/session-notes-2026-08-22.md`.

### Session Update (August 22, 2026 - Thesis Demo Expert Audit, Findings Open)
- Four read-only expert audits reviewed security/privacy, engineering correctness, stale code, and documentation truth across Festival and Demo.
- Verified narrow receipts remain: deterministic reset, direct viewer DELETE denial, separate two-browser state convergence, strict bounded event decoding, and ignored generated artifacts.
- Correction: the stale proxy passed only an isolated one-client mock test; it is globally scoped and was not composed with the live two-browser workflow.
- Correction: Demo persistence/corrections/metrics and cross-source provenance have open correctness defects, so synthetic V1 is not experiment-ready and human runs are blocked.
- Security findings include all-interface local service bindings, unauthenticated/client-asserted evidence, client-writable activity logs promoted to automation, broad viewer supply UPDATE, and documented credential-shaped material in Git history.
- Stale-code findings include unsafe legacy remote setup guidance, 12 tracked unrelated personal cleanup scripts, contract drift, obsolete product/setup status, and 58 strict unused-code diagnostics.
- Report: `docs/reports/thesis-demo-expert-audit-2026-08-22.md`
- Cross-repository operational handoff: `docs/sessions/session-notes-2026-08-22.md`

### Session Update (August 22, 2026 - Thesis Demo Local V1, Verified)
- Status correction: “Verified” below applies only to the named narrow receipts. The later expert-audit entry above supersedes any interpretation that the composed V1 or experiment metrics are ready.
- Implemented deterministic local-only seed/reset/verification for the synthetic canopy handoff.
- Verified two signed-in browser sessions converge on shared claim/packed state and viewer deletion remains denied by RLS.
- Historical receipt: isolated stale-proxy, adapter, Playwright event, and sibling Demo smoke checks passed; the later audit found provenance and composed-workflow gaps that remain open.
- Restored the canonical four-item seed fingerprint after testing.
- Remaining: manual unpacked-extension exercise and real timeboxed human baseline/guided runs; synthetic metrics are not empirical thesis results.
- Report: `docs/reports/thesis-demo-implementation-report-2026-08-22.md`

### Session Update (June 16, 2026 - Safety PIN Remote Rehydrate Fallback, Implemented)
- Implemented: `setEmergencyAccessPin` and `clearEmergencyAccessPin` now rehydrate the owner's encrypted safety profile from Supabase when the local SQLite row is missing.
- Implemented: remote rehydration is cached back into local safety storage before continuing the PIN mutation flow.

### Session Update (June 17, 2026 - Safety Emergency Unlock Freshness Mitigation, Implemented)
- Implemented: `unlockEmergencyProfile` now retries against a newer remote encrypted profile when the locally cached PIN hash does not match.
- Implemented: refreshed remote encrypted profiles are cached back into local safety storage before retrying unlock verification.
- Preserved: offline behavior still falls back to the locally cached encrypted profile when remote refresh is unavailable.

### Session Update (April 12, 2026 - Food Planner Dietary Icon Fix, Verified)
- Implemented: replaced emoji-based dietary flag rendering with deterministic Lucide icon rendering in Food Planner meal cards and meal editor modal.
- Verified: dietary icons now render correctly (no question-mark glyphs) in the dietary selector and saved meal badges while keeping existing dietary flag values unchanged.

### Session Update (April 20, 2026 - Travel Blocker Remediation, Verified)
- Implemented: Travel viewer write restrictions at both UI controls and hook mutation entry points.
- Implemented: trip-level meetup pin realtime subscription on `trips` updates.
- Verified: Travel scope blockers from April 12 QA are closed; non-Travel compile issues were tracked separately and fixed later on April 20.

### Session Update (April 20, 2026 - Safety/Crypto TypeScript Cleanup, Verified)
- Implemented: normalized `group_members` relation typing in safety emergency member loading.
- Implemented: fixed Web Crypto `importKey`/decrypt buffer typing by passing explicit `ArrayBuffer` key/cipher inputs.
- Verified: `npx tsc --noEmit` now passes with zero TypeScript errors.

### Session Update (April 20, 2026 - Safety PIN Preservation on Profile Save, Verified)
- Implemented: hardened `useSafetyProfile.saveSafetyProfile` to resolve and preserve emergency PIN encrypted fields from local/remote encrypted rows.
- Implemented: normal profile saves now fail closed on inconsistent partial PIN field state and do not upsert PIN fields to Supabase.
- Verified: non-PIN edits no longer clear `emergency_access_blob`, `emergency_access_pin_salt`, or `emergency_access_pin_hash`.

### Session Update (April 22, 2026 - Safety + Camp Grid Re-validation)
- Verified: Camp Grid destructive overwrite blocker is fixed; failed remote loads now produce blocked/retry state and save re-checks remote item IDs before any delete.
- Verified: `npx tsc --noEmit` and `npm run lint` both pass.
- Finding: Safety PIN set/update/disable still needs local-to-remote rehydrate fallback when the local encrypted row is missing.
- Finding: Safety emergency unlock still needs stale-cache mitigation when a valid PIN was rotated on another device.
- Report: `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`

### Session Update (April 10, 2026 - Safe-Area Pass, Verified)
- Implemented: added app-level SafeAreaProvider in app root layout.
- Implemented: added SafeAreaView coverage for tabs, auth routes, onboarding route, and join route.
- Implemented: updated Settings shared page frame to include SafeAreaView so all settings pages inherit top inset handling.
- Implemented: Food Planner add/edit modal now uses full-screen modal presentation plus explicit safe-area context inside the modal.
- Implemented: Budget route now uses react-native-safe-area-context SafeAreaView with top edges.
- Finding: route scan still shows layout files without direct SafeAreaView references (expected for router layout files).
- Finding: settings route files do not directly reference SafeAreaView but are covered via shared SettingsPageFrame wrapper.

### QA Validation Completed (April 10, 2026)
- [x] Re-tested Food Planner add/edit modal on iPhone notch/status-bar layouts; X and Save are tappable.
- [x] Re-tested top safe-area behavior on tabs/auth/onboarding/join/settings flows.
- [x] Re-tested Budget top safe-area spacing and header interactions on iOS.
- [x] Confirmed no double top padding in Food Planner modal.

### Open Bugs (Reported April 10, 2026)
- [x] Food Planner: dietary flag icons are incorrect and currently render as question marks (verified fixed April 12, 2026)
- [x] Packing Checklist: screen/header interferes with the notification bar or top safe area on device, which blocks swipe-back and can make the X/save controls unusable (verified fixed)
- [x] Bottom menu/tab icons do not route correctly beyond Home in the current app build under audit (verified fixed)
- [x] Safe-area follow-up: re-check all routes against the April 7 safe-area pass because current device behavior appears to regress in some routes such as packing list (verified fixed in current build)

### Open Bugs (Reported April 12, 2026 - Agent QA Dispatch)
- [x] Camp Grid: critical risk of destructive overwrite when remote load fails and user saves default local layout (verified fixed April 22, 2026)
- [x] Safety Profile: normal profile save can clear emergency PIN fields when local encrypted row is missing (verified fixed April 20, 2026)
- [x] Travel: viewer role write actions are now blocked for non-editor roles (verified fixed April 20, 2026)
- [x] Travel: meetup pin is now subscribed to trip-level realtime updates (verified fixed April 20, 2026)
- [x] Safety/Crypto TypeScript errors in `app/trips/[id]/safety-emergency.tsx` and `lib/crypto/safetyEncryption.ts` are fixed (verified April 20, 2026)
- [x] Safety Profile: emergency PIN set/update/disable needs remote fallback when local encrypted row is missing (implemented June 16, 2026)
- [x] Safety Profile: emergency unlock needs stale-cache mitigation after PIN rotation on another device (implemented June 17, 2026)

References:
- `docs/reports/travel-qa-audit-2026-04-12.md`
- `docs/reports/safety-camp-grid-validation-report-2026-04-12.md`
- `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`

## Completed Fixes (April 10, 2026)
- ✅ Added global SafeAreaProvider at app root and aligned screen-level safe-area wrappers on user-facing routes.
- ✅ Food Planner add/edit modal safe area fixed; modal header controls no longer blocked by status/notch area.
- ✅ Budget Add Expense modal safe area fixed with full-screen modal presentation + top/bottom insets.
- ✅ Budget screen safe-area implementation aligned to react-native-safe-area-context.

### Safe-Area Audit (✅ COMPLETED - April 7, 2026)
- [x] Check ALL screens for scrolling overlap into notification/camera lens top bar
- [x] Verify SafeAreaView wrapper pattern is consistently applied
- [x] Test on device with different notch sizes (iPhone 12, 14, 15 variations)
- [x] All 9 module screens now have SafeAreaView (Travel & Budget were already done)
- [x] Removed hardcoded `paddingTop: 60` from headers in: Supply List, Packing Checklist, Collaboration, Food Planner
- [x] Camp Grid uses `edges={['left', 'right']}` for landscape mode

### Future Enhancements
- I want to be able to import line ups as they drop so all users have easy access to them.
- Travel map should support multiple pins instead of only a single shared trip pin.
- Travel map should better visualize routes, including markers or indicators where paths cross/overlap.

## Completed Fixes (April 7, 2026)
- ✅ Top bar overlap: SafeAreaView wrapper applied to Travel screen (safe-area-context)
- ✅ Vehicle/flight modals: Modal container height changed from `maxHeight` to explicit `height` so form inputs display
- ✅ Safe-area audit complete: All 9 module screens now wrapped in SafeAreaView:
  - Supply List (edges=['top'])
  - Packing Checklist (edges=['top'])
  - Collaboration (edges=['top'])
  - Safety Profile (edges=['top'])
  - Food Planner (edges=['top'])
  - Lineup (edges=['top'])
  - Camp Grid (edges=['left', 'right'] for landscape)
  - Travel (edges=['top']) — already done
  - Budget (has SafeAreaView) — already done
- ✅ Removed hardcoded `paddingTop: 60` from headers where SafeAreaView applied
- ✅ SafeAreaView deprecation warning: Implemented using react-native-safe-area-context v5.6.2
- ✅ Lineup: Fixed TextInput import (moved to top), replaced emoji filter tabs with proper icons + labels (Must See, Want to See, Skip)

## Follow-Up (Deferred to Future Work)
- Why is outfit voting in travel plans? → Moved to separate module
- Travel plans map zoom/pan gestures? → Supported by react-native-maps (touch gestures enabled)
- Multiple pin drops with labels: Implemented single trip-level pin with rich metadata (label, notes, type, creator) via bottom-sheet editor. Multi-pin array design deferred.
- Route visualization improvements for vehicles/waypoints, including cross-path markers, remain deferred future work.
- Gas calculator: Out of scope; consider for future feature set
- Unique usernames for contact lookup: Out of scope; deferred to future work
