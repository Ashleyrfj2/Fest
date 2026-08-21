# Test Notes

Use this file to capture things you want to add, adjust, or fix while testing the app.

## Outstanding Issues

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
