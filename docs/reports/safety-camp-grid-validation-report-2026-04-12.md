# Senior QA Report - Safety + Camp Grid Validation

Date: 2026-04-12  
Scope source: docs/handoffs/safety-camp-grid-validation-handoff.md

Overall: FAIL  
Ready to ship: NO

## Post-Audit Update (April 12, 2026)

- Lint gate is now implemented after this QA run.
- `npm run lint` is now available and passing.
- Remaining blockers in this report are still active until code fixes land.

## Release Gate Summary

- Typecheck: FAIL (`npx tsc --noEmit`)
- Lint: PASS (post-audit update; script now available)
- Targeted tests: NOT AVAILABLE (no project test script found)
- Critical/High findings: PRESENT

## Validated Scenarios and Outcomes

### Safety emergency PIN lifecycle

1. Set PIN flow wiring: PASS with caveats
- UI and validation exist in `safety-profile` screen (4-8 digits).
- Hook exposes `setEmergencyAccessPin` and persists blob/salt/hash.
- Caveat: lifecycle actions depend on local cache availability (Finding 4).

2. Update PIN flow wiring: PASS with caveats
- Same action path as set PIN, UI label toggles Set/Update based on `hasEmergencyAccessPin`.
- Caveat: same local-cache dependency as above.

3. Disable PIN flow wiring: PASS with caveats
- UI action calls `clearEmergencyAccessPin`, clears blob/salt/hash.
- Caveat: same local-cache dependency as above.

### Safety emergency unlock workflow

1. Correct PIN unlock: PASS (code path present)
- Unlock verifies hash, decrypts emergency payload, returns profile object.

2. Wrong PIN fails safely: PASS
- Hook throws `Incorrect emergency PIN` and UI shows `Unlock Failed` alert.

3. Offline/cache behavior: CONDITIONAL
- Local-first unlock works offline if cache is present.
- Stale cache can block valid unlock after owner changes PIN remotely (Finding 5).

### Camp Grid auth-transition sync behavior

1. Signed out: PASS
- Shared DB load/save gated off when auth user absent.

2. Auth loading/sign-in transition: PASS with caveat
- Hook re-loads when auth gate changes and only attempts remote read when allowed.
- Caveat: remote read failure is swallowed; can mask transition/network errors (Finding 1).

3. Signed in: CONDITIONAL
- Remote load/save occurs when auth gate is open.
- Critical caveat: silent remote load failure can lead to destructive overwrite of shared layout (Finding 1).

### Specific risk check from session-notes-2026-04-10

Status: CONFIRMED (still present)
- Normal profile save still reconstructs emergency fields from local-only encrypted row; missing local row can null these fields and push nulls upstream (Finding 2).

## Findings (Severity Ranked)

### 1) [Critical] Camp Grid can overwrite shared layout after silent remote-load failure
- Impact:
  - Existing shared camp layout/items can be deleted/overwritten, causing cross-user data loss.
- Evidence:
  - Remote read failure is silently swallowed (`remoteSnapshot = null`) instead of surfacing a blocked state.
  - Fallback path initializes default local grid.
  - Save path deletes remote items not present locally.
- Location:
  - `lib/sqlite/useCampGridDB.ts:299`
  - `lib/sqlite/useCampGridDB.ts:304`
  - `lib/sqlite/useCampGridDB.ts:338`
  - `lib/sqlite/useCampGridDB.ts:497`
  - `lib/sqlite/useCampGridDB.ts:528`
  - `lib/sqlite/useCampGridDB.ts:533`
- Repro steps:
  1. Use a trip that already has shared remote camp items.
  2. Open Camp Grid on a device with no local camp-grid cache for that trip.
  3. Force a transient remote fetch failure during initial load (network flap/auth token issue).
  4. Observe default local grid is created.
  5. Tap Save Layout.
  6. Remote `camp_items` not in local set are deleted.
- Fix:
  - When `canSyncWithSharedDb` is true and remote read fails, do not auto-fallback to default grid for save-capable state.
  - Surface explicit remote-load failure state + retry action.
  - Block destructive save until a successful remote read or explicit user confirmation for overwrite.

### 2) [High] Emergency PIN fields can still be cleared during normal profile save
- Impact:
  - Emergency unlock can be unintentionally disabled (blob/salt/hash nulled) after a non-PIN profile edit.
- Evidence:
  - Save path reads emergency fields from local-only encrypted row.
  - If local row is absent, emergency fields are set to null in payload used for upsert.
- Location:
  - `lib/hooks/useSafetyProfile.ts:223`
  - `lib/hooks/useSafetyProfile.ts:263`
  - `lib/hooks/useSafetyProfile.ts:264`
  - `lib/hooks/useSafetyProfile.ts:265`
- Repro steps:
  1. Ensure remote profile has emergency PIN enabled.
  2. Remove/corrupt local `safety_profiles` row for that user/trip.
  3. Edit any non-PIN safety field and save profile.
  4. Verify remote `emergency_access_*` fields are written as null.
- Fix:
  - Preserve emergency fields from authoritative source (current remote row or in-memory encrypted snapshot) when local row missing.
  - Add guard: refuse normal save if emergency fields cannot be safely preserved.

### 3) [High] Typecheck is failing in Safety emergency and crypto paths
- Impact:
  - Build gate fails; increases regression risk and blocks reliable release.
- Evidence:
  - `npx tsc --noEmit` returned 3 errors.
- Location:
  - `app/trips/[id]/safety-emergency.tsx:65`
  - `lib/crypto/safetyEncryption.ts:229`
  - `lib/crypto/safetyEncryption.ts:263`
- Repro steps:
  1. Run `npx tsc --noEmit` at repo root.
  2. Observe errors for member relation cast and `crypto.subtle.importKey` buffer typing.
- Fix:
  - Normalize/strongly type `group_members` relational `user` shape before filtering/rendering.
  - Provide `ArrayBuffer`-compatible key material typing for `importKey` calls.

### 4) [Medium] PIN set/disable lifecycle hard-fails when local encrypted row is unavailable
- Impact:
  - User cannot update or disable emergency PIN even if remote profile exists; emergency workflow appears broken.
- Evidence:
  - Both set and clear operations require local row and throw if missing.
- Location:
  - `lib/hooks/useSafetyProfile.ts:389`
  - `lib/hooks/useSafetyProfile.ts:391`
  - `lib/hooks/useSafetyProfile.ts:436`
  - `lib/hooks/useSafetyProfile.ts:438`
- Repro steps:
  1. Have an existing remote safety profile.
  2. Clear local safety DB row.
  3. Attempt Update PIN or Disable PIN.
  4. Observe `Unable to find local safety profile to update` error.
- Fix:
  - Add remote fallback fetch + local rehydrate before mutating emergency fields.

### 5) [Medium] Emergency unlock can use stale local cache and reject valid updated PIN
- Impact:
  - Time-sensitive emergency unlock can fail after owner rotates PIN on another device.
- Evidence:
  - Unlock fetches remote only when local row is absent; stale local row bypasses remote refresh.
- Location:
  - `lib/hooks/useSafetyProfile.ts:462`
  - `lib/hooks/useSafetyProfile.ts:474`
  - `lib/hooks/useSafetyProfile.ts:479`
- Repro steps:
  1. Device A caches target member safety profile.
  2. Owner updates emergency PIN from Device B.
  3. Device A attempts unlock with new PIN while stale cache remains.
  4. Unlock fails against old cached hash/blob.
- Fix:
  - Add freshness strategy (force remote re-check on failed unlock, timestamp validation, or explicit refresh action before PIN verification).

### 6) [Low] Emergency PIN hashing uses single SHA-256 pass
- Impact:
  - Weaker brute-force resistance vs memory-hard/iterative KDF if encrypted PIN artifacts leak.
- Evidence:
  - Hash derivation uses `SHA256(salt:pin)` and key derivation reuses same digest.
- Location:
  - `lib/crypto/safetyEncryption.ts:204`
  - `lib/crypto/safetyEncryption.ts:206`
  - `lib/crypto/safetyEncryption.ts:211`
- Fix:
  - Migrate to stronger KDF approach with versioned metadata for forward migration.

## Cleanup Completed

- No code removal/edit was performed (per handoff constraint to keep edits doc-only).

## Residual Risks

- Automated lint exists, but no targeted automated tests exist for these flows.
- Validation is based on static code-path analysis and build evidence; no device runtime replay was executed in this pass.

## Prioritized Follow-up Tasks

1. P0: Block destructive Camp Grid save after remote-load failure; add explicit retry/error state.
2. P0: Fix Safety save payload preservation so emergency PIN fields cannot be nulled by normal profile save.
3. P0: Resolve current TypeScript errors in `safety-emergency` and `safetyEncryption`.
4. P1: Add remote fallback/rehydration for PIN set/disable operations when local row missing.
5. P1: Add stale-cache mitigation for emergency unlock (refresh-on-fail or timestamp-based invalidation).
6. P2: Upgrade emergency PIN hash/KDF strategy and include migration versioning.
7. P2: Add project lint and targeted safety/camp-grid regression tests to CI/scripts.
