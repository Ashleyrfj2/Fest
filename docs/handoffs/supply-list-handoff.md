# Supply List Handoff

## Owner
Full-stack mobile engineer.

## Goal
Build the collaborative Supply List module for trip members to track who is bringing what, with item status, assignment, and group clarity.

## Why This Is Next
This is a P1 collaboration feature with direct utility and relatively low design ambiguity compared with live or media-heavy modules. It maps cleanly to the existing trip/member model.

## Source Context
- [Design spec](../product/design-spec.md)
- [Data model](../product/data-model.md)
- [Trip system](../product/trip-system.md)
- [Session notes](../sessions/session-notes-2026-03-19.md)
- [Session notes](../sessions/session-notes-2026-04-03.md)

## Scope
- Build the supply list module UI and interactions.
- Support item creation with name, quantity, category, and optional assignment.
- Support item states: Unassigned, Claimed, Packed.
- Show who claimed an item and whether it is packed.
- Support duplicate detection and clear group visibility.
- Respect trip roles and module permissions.

## Non-Goals
- Do not extend into meal planning yet.
- Do not add receipt workflows or budget logic.
- Do not redesign the overall trip dashboard.
- Do not add supply export/sharing features unless explicitly required by the module spec.

## Key Product Requirements
- The module should answer: who is bringing what, what is still missing, and what is already packed?
- It should be easy for both leader and members to understand status at a glance.
- Duplicate detection should prevent unnecessary confusion.
- The state model should align with the existing supply item schema in the docs.
- The UI should support quick editing without feeling like an admin form.

## Recommended Interaction Model
- Trip members can add items to the list.
- Items can be claimed by one person.
- Items can later be marked packed.
- Leaders can resolve conflicts or duplicates if the UX needs moderation.
- The module should favor fast scanning over dense configuration.

## Dependencies
- Trip membership and role data from the current collaboration system.
- Existing database tables or shared state for supply items.
- Navigation entry from the trip dashboard.

## Acceptance Criteria
- Users can create, claim, and pack supply items.
- The list clearly shows assignment and status.
- Duplicate items are detectable and surfaced in a useful way.
- The module respects role-based access rules.
- The screen feels consistent with the rest of the app’s warm, premium visual language.

## Suggested Implementation Order
1. Define the item and status UI states.
2. Build list creation and item row components.
3. Wire claim/pack state transitions.
4. Add duplicate detection and status summaries.
5. Test role permissions and empty states.

## Risks
- Too many status controls can make the list feel heavy.
- Duplicate handling can become confusing if not explained well.
- If permissions are unclear, members may hesitate to use the module.

## Dated implementation correction — August 22, 2026

The original handoff above is preserved as the implementation brief. Current verified authorization behavior is narrower:

- Leaders/editors create and edit item details; only leaders/editors delete.
- Any trip member may claim an unassigned item.
- A member may unclaim, pack, or unpack only an item they own.
- Assignment/status workflow changes use database-owned RPCs; direct authenticated workflow-column mutation is unavailable.
- Expected denials return a non-applied result and write an immutable private audit. Ordinary clients cannot forge the reserved denial activity or read/write the private audit.
- Focused lint, type, deterministic, reset, RLS/RPC, live equipment, and adapter reconciliation checks passed. The fresh two-cycle composed thesis workflow remains pending.
