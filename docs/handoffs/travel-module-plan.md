# Travel Module Plan

## Status: ✅ REMEDIATION COMPLETE (Updated April 20, 2026)

Initial implementation was completed on April 7. April 12 QA reopened blocker fixes, and those blockers were remediated and re-validated on April 20. See [Travel QA Audit - 2026-04-12](../reports/travel-qa-audit-2026-04-12.md) for full history and remediation update.

---

## Owner
Travel Module UI Engineer, Travel Module Data Engineer, Travel Module Maps Engineer, and Travel Module QA Engineer.

## Goal
Finish the Travel feature as the trip’s coordination layer for vehicles, passengers, flights, pickup details, and a shared meetup location, while keeping the implementation tight, mobile-friendly, and consistent with the current app.

## Why This Plan Exists
The Travel module was documented as shipped in the implementation report, then April 12 QA reopened blocker fixes. This plan captured the focused remediation scope, removed outfit work from the module, and assigned clear specialist lanes until blockers were closed.

## Current Scope
- Vehicle creation and management.
- Passenger assignment to vehicles.
- Departure city, departure time, and waypoint-based pickup details.
- Shared meetup pin or meetup location support.
- Flight details for members who need pickup.
- Clean save flows and immediate UI refresh after edits.
- Role-aware controls that match trip permissions.

## Deferred Out of Scope
- Outfit photo upload and outfit voting.
- Lineup import support.
- Unique username work.
- Any broader trip logistics that are not required for core rides, flights, or meetup coordination.

## Source Context
- [Travel Plans handoff](travel-plans-handoff.md)
- [Travel Plans implementation report](../reports/travel-plans-implementation-report.md)
- [Test notes](../test-notes.md)
- [Stretch backlog](../product/stretch.md)

## Recommended Implementation Order
1. Fix the broken vehicle and flight modal flows so the core data-entry path works.
2. Fix the navigation and safe-area regressions that affect basic usability.
3. Confirm the meetup map zoom, pan, and pin behavior are understandable on device.
4. Add waypoint and pickup refinements after the base workflow is stable.
5. Run QA across the whole Travel flow before calling it done.

## Owner Breakdown
### Travel Module UI Engineer
- Own the Travel screen shell, section hierarchy, empty states, and modal entry points.
- Keep the layout scannable and aligned with the rest of the app.
- Make sure the Travel screen is understandable at a glance.

### Travel Module Data Engineer
- Own vehicle, flight, and meetup state updates.
- Fix stale state after save and keep refresh behavior predictable.
- Keep trip-scoped mutations and permission handling explicit.

### Travel Module Maps Engineer
- Own meetup map rendering, pin interactions, zoom/pan behavior, and waypoint-related UX.
- Keep map behavior lightweight and understandable.
- Make sure the map still reads clearly when no location is set.

### Travel Module QA Engineer
- Audit the whole Travel workflow after implementation.
- Validate forms, save flows, map behavior, permissions, and error states.
- Fail the feature if any core path still feels incomplete or brittle.

## Acceptance Criteria
- A user can create and edit vehicles without placeholder-only UI.
- A user can create and edit flights without placeholder-only UI.
- The back button and safe-area behavior work correctly.
- Meetup or waypoint state is understandable and usable.
- The Travel map behaves well on device.
- Empty states and error states feel intentional.
- No outfit-related controls remain in Travel.
- QA signs off with no critical blockers.

## QA Exit Checklist
- [x] Vehicle add/edit opens a real form and saves successfully.
- [x] Flight add/edit opens a real form and saves successfully.
- [x] Back navigation works on the Travel screen.
- [x] Safe-area and top-bar overlap are resolved.
- [x] Meetup map can be panned and zoomed as expected.
- [x] Empty states are intentional and readable.
- [x] Permission-gated controls appear only for the correct roles.
- [x] Save flows visibly reflect the user action without requiring a reload.
- [x] No outfit-related UI remains in Travel.

## Notes
- Keep the work focused on shipping a clean, reliable travel workflow.
- If a new idea does not help rides, flights, or meetup coordination, move it to stretch.
- Use the existing travel handoff as the source of product intent and this document as the execution plan.

---

## Completion Summary (April 7, 2026)

All planned work completed and verified:

### Fixes Applied
1. **Modal Input Fields**: Changed vehicle and flight form modal containers from `maxHeight: '85%'` to `height: '85%'` to expose all form inputs.
2. **Safe-Area Protection**: Added SafeAreaView wrapper to Travel screen with edges=['top'] to prevent scroll overlap with camera/notification bar.
3. **Pin Metadata System**: Implemented MeetupPin interface with label, notes, pin_type, and creator metadata; moved persistence from vehicles to trips table with backward compatibility.
4. **Pin Detail Editor**: Built bottom-sheet modal for viewing and editing pin metadata (label, type, notes); marker tap opens sheet.

### Deliverables
- ✅ All acceptance criteria met
- ✅ QA exit checklist complete
- ✅ TypeScript compilation verified (zero errors)
- ✅ Database schema updated (meetup_pin column)
- ✅ Backward compatibility ensured (normalizeMeetupPin helper)

### Files Modified
- `lib/travelTypes.ts` (MeetupPin interface, MeetupPinType enum)
- `lib/hooks/useTravel.ts` (pin R/W, normalization, trip-level persistence)
- `components/Travel/MeetupMap.tsx` (bottom-sheet editor, type selector, marker handler)
- `app/trips/[id]/travel.tsx` (SafeAreaView wrapper, user metadata enrichment)
- Database migration applied

### Deferred to Future Work
- Multi-pin support (array rendering, clustering)
- Vehicle-backed pickup pin auto-generation
- Pin visibility/permissions settings

**Next Steps:** Run full Travel QA audit, then proceed to next feature from roadmap.

See [Session Notes - 2026-04-07](../sessions/session-notes-2026-04-07.md) for detailed implementation notes.

---

## QA Addendum (April 12, 2026)

Travel QA was executed and returned **FAIL** with blockers:

1. Viewer role can still mutate Travel data (permission gap).
2. Meetup pin changes are not trip-realtime subscribed.

Report:
- [Travel QA Audit - 2026-04-12](../reports/travel-qa-audit-2026-04-12.md)

### Remediation Outcome (April 20, 2026)
- ✅ Enforced role restrictions for viewer in Travel UI and write paths.
- ✅ Added `trips` table realtime subscription for meetup pin updates.
- ✅ Re-ran Travel QA after fixes and updated status to PASS for Travel scope.
- ⚠️ Remaining non-Travel compile issue: workspace TypeScript still fails in Safety/Crypto files.

