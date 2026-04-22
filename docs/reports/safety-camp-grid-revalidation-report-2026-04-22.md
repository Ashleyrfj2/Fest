# Senior QA Re-validation Report - Safety + Camp Grid

Date: 2026-04-22  
Scope source: `docs/handoffs/safety-camp-grid-validation-handoff.md`  
Previous report: `docs/reports/safety-camp-grid-validation-report-2026-04-12.md`

Overall: FAIL  
Ready to ship this scope: NO

## Release Gate Summary

- Typecheck: PASS (`npx tsc --noEmit`)
- Lint: PASS (`npm run lint`)
- Targeted automated tests: NOT AVAILABLE (no project test script found)
- Critical/High findings from April 12: RESOLVED
- Remaining acceptance risk: PRESENT in Safety emergency PIN cache/fallback behavior

## Validated Scenarios and Outcomes

### Camp Grid Auth and Sync Guardrails

1. Signed-out/auth-loading sync gate: PASS
- Shared DB sync remains gated by `authUser` and auth loading state in `useCampGridDB`.

2. Remote-load failure visibility: PASS
- Remote read errors now set `remoteLoadStatus = 'failed'` and preserve a remote load error.
- Camp Grid screen surfaces the blocked state as `Retry Sync`.

3. Destructive save protection after failed remote load: PASS
- Save now re-reads existing remote item IDs before deleting.
- If remote item IDs exist and trust has not been established, save returns `destructive-overwrite-risk` instead of deleting.
- If the pre-save remote read fails, save returns `remote-load-failed` and does not continue.

4. Local default grid after remote failure: PASS with user-confirm caveat
- A default local grid can still be created after a failed remote load, but save is guarded by remote item re-check and explicit overwrite confirmation when deletion risk exists.

### Safety Emergency PIN Lifecycle

1. Set/update PIN with normal local cache: PASS
- `setEmergencyAccessPin` validates 4-8 digits, encrypts emergency payload, stores blob/salt/hash locally, and syncs those fields remotely.

2. Disable PIN with normal local cache: PASS
- `clearEmergencyAccessPin` clears blob/salt/hash locally and syncs the clear remotely.

3. Normal profile save does not clear emergency PIN fields: PASS
- Save now resolves emergency PIN fields from local/remote encrypted rows.
- Normal profile upsert omits emergency PIN fields, so a non-PIN edit no longer nulls them remotely.
- Inconsistent partial emergency PIN state fails closed.

4. Set/update/disable PIN when local encrypted row is missing: FAIL
- The hook still throws `Unable to find local safety profile to update` if local SQLite is missing, even when a remote profile exists.
- This violates the handoff's offline/cache/network-transition reliability scope because users can be blocked from rotating or disabling emergency access after cache loss or device restore.

### Safety Emergency Unlock

1. Correct PIN with current local or fetched profile: PASS
- Unlock fetches remote data when no local row exists, stores it locally, verifies the PIN hash, decrypts the payload, and returns the emergency profile.

2. Wrong PIN failure: PASS
- Wrong PIN throws `Incorrect emergency PIN` without exposing emergency payload data.

3. Updated PIN with stale local cache: FAIL
- Unlock prefers existing local cache and does not refresh remote data before verification or after hash mismatch.
- If the profile owner rotates their PIN on another device, a device with stale cache can reject the current valid PIN.

## Severity-ranked Findings

### 1. [Medium] Safety PIN set/update/disable still hard-fails when local encrypted row is missing

Impact:
- A user can be unable to update or disable emergency PIN access after local cache loss, despite having an existing remote safety profile.

Evidence:
- `setEmergencyAccessPin` reads `getSafetyProfileLocal(...)` and throws when absent.
- `clearEmergencyAccessPin` follows the same local-only mutation precondition.

Locations:
- `lib/hooks/useSafetyProfile.ts:519`
- `lib/hooks/useSafetyProfile.ts:520`
- `lib/hooks/useSafetyProfile.ts:566`
- `lib/hooks/useSafetyProfile.ts:567`

Repro:
1. Create/save a Safety profile and set an emergency PIN.
2. Ensure the remote `safety_profiles` row exists.
3. Remove the local SQLite row for that trip/user or simulate cache loss on a second device.
4. Attempt Update PIN or Disable PIN.
5. Observe the local-row error instead of remote rehydrate and retry.

Required fix:
- Add a helper that resolves the encrypted owner profile from local first, then remote.
- If remote exists, save it locally, mark synced, and continue the PIN mutation.
- Keep the current fail-closed behavior if neither local nor remote encrypted profile is available.

### 2. [Medium] Emergency unlock can reject a valid newly rotated PIN because stale local cache wins

Impact:
- Time-sensitive emergency access can fail after a profile owner updates their PIN on another device.

Evidence:
- `unlockEmergencyProfile` only fetches Supabase when no local profile exists.
- Existing local rows are verified directly, with no freshness check or refresh-on-fail path.

Locations:
- `lib/hooks/useSafetyProfile.ts:590`
- `lib/hooks/useSafetyProfile.ts:592`
- `lib/hooks/useSafetyProfile.ts:609`
- `lib/hooks/useSafetyProfile.ts:615`

Repro:
1. Device A caches another member's safety profile with PIN `1111`.
2. Profile owner updates emergency PIN to `2222` from Device B.
3. Device A attempts unlock with `2222` while stale cache remains.
4. Observe `Incorrect emergency PIN` even though `2222` is valid remotely.

Required fix:
- On PIN hash mismatch, fetch the remote encrypted profile and retry verification if remote `updated_at` is newer than local.
- Alternatively, perform a forced remote refresh before unlock when online.
- Preserve offline unlock behavior by falling back to local verification only when remote refresh is unavailable.

## Resolved Findings

1. [Critical] Camp Grid destructive overwrite after silent remote-load failure: RESOLVED
- Remote read failure is no longer silent.
- Save performs a pre-delete remote item check.
- Destructive deletes require established remote trust or explicit overwrite confirmation.

2. [High] Safety normal save clears emergency PIN fields: RESOLVED
- Emergency fields are preserved from local/remote encrypted sources.
- Normal profile saves omit emergency PIN fields from remote upsert.

3. [High] Safety/Crypto TypeScript errors: RESOLVED
- Typecheck passes.

## Exact Next Fixes

1. P1: Implement Safety encrypted-profile rehydrate helper for `setEmergencyAccessPin` and `clearEmergencyAccessPin`.
2. P1: Add unlock stale-cache mitigation with remote refresh-on-fail/newer-remote retry.
3. P2: Add focused regression tests for Safety PIN preservation, local-row-missing PIN mutation, stale-cache unlock, and Camp Grid destructive-save guard.
4. P2: Upgrade emergency PIN hashing/KDF with versioned migration metadata.

## Notes

- This pass was static/code-path QA plus repository gates; no device runtime replay was executed.
- The former Camp Grid P0 blocker is closed, but the full Safety + Camp Grid validation scope remains FAIL until the Safety cache/freshness scenarios pass.
