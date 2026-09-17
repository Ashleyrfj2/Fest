# Travel QA Audit - April 12, 2026

Travel QA
Status: PASS
Issues found: 0 open
Details:
- RESOLVED HIGH: Viewer role mutation gap is fixed with role gating in UI and fail-closed mutation guards in the Travel hook.
- RESOLVED MEDIUM: Meetup pin trip-level realtime subscription is implemented on `trips` updates.
- RESOLVED LOW: Workspace TypeScript gate is clean after Safety/Crypto fixes.

## Post-Audit Update (April 12, 2026)

- Lint gate was implemented after this QA run.
- `npm run lint` now exists and passes.
- Travel blockers in this report were resolved in code and re-validated on April 20, 2026.

## Remediation Verification (April 20, 2026)

- HIGH blocker fixed at root cause:
	- Viewer write actions are role-gated in Travel UI.
	- Mutation entry points in `lib/hooks/useTravel.ts` now fail closed for non-editor roles.
- MEDIUM blocker fixed at root cause:
	- `lib/hooks/useTravel.ts` now subscribes to `trips` `postgres_changes` updates filtered by trip id.
	- `meetup_pin` state is updated directly from realtime payload with fallback fetch on malformed payload.
- Independent Travel QA re-check result: PASS for Travel scope.
- Workspace compile gate update (April 20, 2026): `npx tsc --noEmit` passes with zero TypeScript errors.

## Scope + Method
- Reviewed the Travel screen, hook, map, cards, and form modals.
- Verified route wiring for Trip Dashboard -> Travel -> Trip Dashboard back path.
- Ran static compile gate with `npx tsc --noEmit`.
- Performed code-path validation for vehicles, flights, meetup map, persistence/realtime behavior, and role gating.

## Passed Flows
- Vehicle add/edit uses real modal forms and save handlers: app/trips/[id]/travel.tsx#L95, app/trips/[id]/travel.tsx#L106, components/Travel/VehicleFormModal.tsx#L87
- Flight add/edit uses real modal form and save handler: app/trips/[id]/travel.tsx#L171, components/Travel/FlightFormModal.tsx#L82
- Vehicle and flight delete handlers are wired through card actions: app/trips/[id]/travel.tsx#L121, app/trips/[id]/travel.tsx#L179, components/Travel/VehicleCard.tsx#L56, components/Travel/FlightCard.tsx#L37
- Travel screen safe-area wrapper is present: app/trips/[id]/travel.tsx#L226
- Map supports pin add/drag/edit/remove flows for editors: components/Travel/MeetupMap.tsx#L92, components/Travel/MeetupMap.tsx#L100, components/Travel/MeetupMap.tsx#L113, components/Travel/MeetupMap.tsx#L227
- Back navigation is deterministic to trip main page (Group festival main page): app/trips/[id]/travel.tsx#L239
- Dashboard route entry to Travel exists and stack route is declared: app/trips/[id].tsx#L152, app/_layout.tsx#L65
- No outfit UI is rendered on Travel screen (OutfitGrid is not exported from Travel barrel): components/Travel/index.ts#L1

## Failed Flows (April 12 Snapshot)
- Permission-gated controls are not consistently enforced for viewer role.
- Realtime behavior is incomplete for meetup pin trip-level state.

## Resolved Since Audit (April 20, 2026)
- Permission-gated controls are now consistently enforced for viewer role.
- Realtime behavior is complete for meetup pin trip-level state via `trips` subscription.

## Severity-Ranked Findings

### 1) HIGH - Viewer can mutate Travel data (permission gap)
Impact:
- Viewer users can create/update their own flight records and join/remove vehicle passenger assignments.
- This violates role-gated behavior expected by handoff QA and permission matrix.

Evidence:
- Role gate variable: app/trips/[id]/travel.tsx#L89
- Flights add button shown without role gate: app/trips/[id]/travel.tsx#L325
- Flights empty-state CTA shown without role gate: app/trips/[id]/travel.tsx#L351
- Flight save writes directly: app/trips/[id]/travel.tsx#L171, app/trips/[id]/travel.tsx#L172, lib/hooks/useTravel.ts#L367
- Vehicle Join Ride CTA not role-gated: components/Travel/VehicleCard.tsx#L175, components/Travel/VehicleCard.tsx#L178
- Passenger insertion mutation: lib/hooks/useTravel.ts#L297, lib/hooks/useTravel.ts#L302
- Product permissions reference: docs/product/design-spec.md#L95

Repro steps:
1. Use a user with viewer role in a trip.
2. Open Trip Dashboard -> Travel.
3. In Flights section, tap + (or Add Your Flight) and save any flight details.
4. Confirm flight row appears and persists.
5. In Vehicles section, tap Join Ride on an available vehicle.
6. Confirm passenger assignment changes persist.

Expected:
- Viewer should only view Travel data (or at minimum should not bypass role-gated mutation rules).

Actual:
- Viewer can perform write operations from UI and corresponding mutation hooks.

### 2) MEDIUM - Meetup pin is not realtime-subscribed at trip level
Impact:
- Multi-user map state can be stale until manual refresh/re-entry.
- One user updating meetup pin is not guaranteed to update other clients live.

Evidence:
- Realtime subscription listens to vehicles, vehicle_passengers, flight_details only: lib/hooks/useTravel.ts#L150, lib/hooks/useTravel.ts#L156, lib/hooks/useTravel.ts#L166, lib/hooks/useTravel.ts#L175
- Meetup pin persistence writes to trips.meetup_pin: lib/hooks/useTravel.ts#L479, lib/hooks/useTravel.ts#L483
- No postgres_changes subscription for trips table in hook.

Repro steps:
1. Open the same trip's Travel screen on two clients.
2. On client A (editor), add or edit meetup pin.
3. Keep client B on Travel screen without navigation.
4. Observe whether map pin updates automatically.

Expected:
- Client B should receive realtime update without route reload.

Actual:
- Code path has no trips table subscription, so realtime update is not guaranteed.

### 3) LOW - Compile gate not clean (non-Travel files)
Impact:
- QA compile checklist cannot be marked fully green at workspace level.

Evidence from `npx tsc --noEmit`:
- app/trips/[id]/safety-emergency.tsx#L65
- lib/crypto/safetyEncryption.ts#L229
- lib/crypto/safetyEncryption.ts#L263

Repro steps:
1. Run `npx tsc --noEmit` from project root.
2. Observe 3 TypeScript errors in Safety/Crypto files.

Expected:
- Zero TypeScript errors.

Actual:
- Compile fails (outside Travel scope but affects overall QA gate).

Update (April 20, 2026):
- Resolved. Safety/Crypto TypeScript issues were fixed and compile gate now passes.

## Partial / Usability Concerns
- No blocking UI defects found in Travel empty states; copy is readable and action-oriented.
- Device-level gesture validation (map pan/zoom) was not executed on hardware in this audit pass.

## Recommended Fixes (Execution Order)
1. ✅ Enforce viewer write restrictions in Travel UI and mutation entry points.
2. ✅ Add realtime subscription for trips table meetup_pin changes in useTravel.
3. ✅ Re-run multi-user verification for meetup pin sync and role matrix behavior.
4. ✅ Clear workspace TypeScript errors to restore full QA compile gate confidence.

Overall: PASS
Ready to ship: YES
Blockers:
- None.
