# Travel Plans Handoff

## Owner
Full-stack mobile engineer with maps and collaboration experience.

## Goal
Build the Travel module as the trip’s coordination layer for cars, passengers, flights, pickups, meetup details, and outfit voting.

## Why This Is Next
Travel is a P1 module in the design spec and fits the current collaboration model well. It is a practical next step after the dashboard because it connects members to real-world coordination without requiring the heavier media or lineup work.

## Source Context
- [Design spec](../product/design-spec.md)
- [Data model](../product/data-model.md)
- [Trip system](../product/trip-system.md)
- [Feature ideas](../product/features.md)
- [Session notes](../sessions/session-notes-2026-03-19.md)

## Scope
- Build vehicle creation and management.
- Support passenger assignment to vehicles.
- Support departure city, departure time, and waypoint-based pickup flows.
- Support a shared meetup pin for the trip.
- Support flight details for members who need pickup.
- Include outfit photo upload and simple voting if the current product phase supports it.
- Keep the experience aligned with trip roles and permissions.

## Non-Goals
- Do not turn this into a full map app.
- Do not build lineup scheduling or budget splitting here.
- Do not expand into trip logistics outside the defined model.
- Do not add unnecessary social feed complexity unless it directly supports travel coordination.

## Key Product Requirements
- The module should answer: who is riding with whom, who still needs pickup, and where should the group meet?
- Waypoint pickup must be easy to understand and not feel like a routing tool for power users only.
- The UI should support both planned rides and flight pickup scenarios.
- The module should fit the collaboration-first behavior already established elsewhere in the app.
- Outfit voting should remain secondary to the logistics surface unless the travel UI gives it a dedicated section.

## Recommended Interaction Model
- One section for vehicles and passengers.
- One section for flights and pickup needs.
- One section for group meetup details.
- One section for outfit posts and votes if included in this phase.
- Keep the module scannable rather than overly dense.

## Dependencies
- Trip members, roles, and permissions are already modeled.
- The trip dashboard should expose a clean route into Travel.
- Storage or upload handling may be needed if outfit photos are included.
- Map primitives or a map SDK may be needed if meetup pins become interactive.

## Acceptance Criteria
- A user can create and view vehicles for a trip.
- A user can assign passengers and pickup details.
- A user can record flight information and mark pickup needs.
- The group meetup point is visible and understandable.
- The module respects trip permissions and feels consistent with the rest of the app.

## Suggested Implementation Order
1. Define the information architecture for vehicles, flights, and meetup data.
2. Build the vehicle and passenger flows.
3. Add flight detail handling and pickup flags.
4. Add meetup pin support.
5. Add outfit upload/voting only if the current build phase can support it without diluting the core travel workflow.

## Risks
- The module can become too broad if outfit features dominate the logistics work.
- Map behavior can add complexity quickly if the interaction model is not constrained.
- Pickup routing can be confusing if the UI does not clearly distinguish vehicle stops from destination meetup points.