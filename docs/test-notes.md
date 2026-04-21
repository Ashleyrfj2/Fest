# Test Notes

Use this file to capture things you want to add, adjust, or fix while testing the app.

## Outstanding Issues

### Session Update (April 12, 2026 - Food Planner Dietary Icon Fix, Verified)
- Implemented: replaced emoji-based dietary flag rendering with deterministic Lucide icon rendering in Food Planner meal cards and meal editor modal.
- Verified: dietary icons now render correctly (no question-mark glyphs) in the dietary selector and saved meal badges while keeping existing dietary flag values unchanged.

### Session Update (April 20, 2026 - Travel Blocker Remediation, Verified)
- Implemented: Travel viewer write restrictions at both UI controls and hook mutation entry points.
- Implemented: trip-level meetup pin realtime subscription on `trips` updates.
- Verified: Travel scope blockers from April 12 QA are closed; remaining compile errors are still non-Travel Safety/Crypto files.

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
- [ ] Camp Grid: critical risk of destructive overwrite when remote load fails and user saves default local layout
- [ ] Safety Profile: normal profile save can clear emergency PIN fields when local encrypted row is missing
- [x] Travel: viewer role write actions are now blocked for non-editor roles (verified fixed April 20, 2026)
- [x] Travel: meetup pin is now subscribed to trip-level realtime updates (verified fixed April 20, 2026)
- [ ] Safety/Crypto TypeScript errors remain in `app/trips/[id]/safety-emergency.tsx` and `lib/crypto/safetyEncryption.ts`

References:
- `docs/reports/travel-qa-audit-2026-04-12.md`
- `docs/reports/safety-camp-grid-validation-report-2026-04-12.md`

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
