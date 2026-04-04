# Trip Dashboard Handoff

## Owner
Senior mobile product designer or mobile frontend lead.

## Goal
Build the Level 2 Trip Dashboard as the main per-trip home surface. This screen should feel like the operational center of the trip: quick status, crew visibility, module entry points, and next actions.

## Why This Is Next
This is the orchestration layer for the product. The docs say the trip dashboard is designed but not yet built, and it is the place where every major module is entered from. Without it, feature work becomes fragmented.

## Source Context
- [Trip system](../product/trip-system.md)
- [Design system and navigation direction](../product/ui-decisions.md)
- [Module priority and permissions](../product/design-spec.md)
- [Session note on current status](../sessions/session-notes-2026-03-19.md)

## Scope
- Build a polished trip-level dashboard for a single trip.
- Show trip name, festival, dates, countdown, crew list, and role badges.
- Surface the eight module cards in a strong hierarchy.
- Include a clear overall readiness/progress indicator.
- Include an activity/feed area or equivalent status surface for group updates.
- Support leader-only actions like settings and module management entry points.
- Preserve the existing visual language already established in Home and Settings.

## Non-Goals
- Do not implement the module internals themselves.
- Do not redesign trip creation or invite flows.
- Do not add backend schema changes unless the current trip data model truly needs one.
- Do not introduce a new visual system that breaks the current warm premium direction.

## Key Product Requirements
- The dashboard must help a user answer three questions immediately: where am I, what should I do next, and who is here with me?
- It should clearly distinguish leader, editor, and viewer states.
- Empty or partial states must feel intentional, not broken.
- The screen should reinforce the “start with one thing” product philosophy from onboarding.
- Camp Grid should be treated as the primary live module, with other modules discoverable but secondary.

## Recommended Layout Priorities
- Top area: trip identity and countdown.
- Middle area: readiness/progress and the most important live status.
- Crew area: members, avatars, and roles.
- Module area: cards or grid with strong tap targets.
- Secondary area: recent activity or setup prompts.

## Content Questions To Resolve
- Should the dashboard be action-first, timeline-first, or social-first? The docs explicitly note this is still TBD.
- How much space should module cards receive relative to trip summary and crew data?
- Should the dashboard prioritize current setup completion or live updates from the crew?

## Dependencies
- Trip data, group members, and roles already exist in the product model.
- Camp Grid is the first live module, so its entry point should be promoted here.
- The settings route already exists and should be reachable from leader controls.

## Acceptance Criteria
- A user can open a trip and immediately understand the trip context.
- A user can navigate to Camp Grid and other modules from a single place.
- Leaders have clear access to management actions.
- Empty states and partial completion states are visually complete and understandable.
- The screen matches the existing mobile design language and does not feel like a placeholder.

## Suggested Implementation Order
1. Define the information hierarchy and state model.
2. Build the visual shell and responsive layout.
3. Wire trip summary, crew, and module navigation.
4. Add activity/readiness components.
5. Refine empty states, loading states, and leader controls.

## Risks
- Overloading the screen with too many competing priorities.
- Making the dashboard feel like a generic card grid instead of a guided command center.
- Under-designing empty states, which would weaken first impression for joiners.