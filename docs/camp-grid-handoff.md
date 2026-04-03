# Camp Grid Handoff

## Owner
Senior mobile engineer with strong React Native gesture and interaction experience.

## Goal
Complete the hero Camp Grid feature as a polished drag-and-drop campsite layout tool that is usable offline and ready for shared trip planning.

## Why This Is Next
Camp Grid is the product’s hero feature and the highest-value planning surface. The docs already describe it as in progress, so this handoff is for finishing the core experience with confidence rather than restarting the concept.

## Source Context
- [Camp Grid plan](Camp-Grid.md)
- [Festival dimension source of truth](Festival-dimensions.md)
- [Data model](data-model.md)
- [Design spec](design-spec.md)
- Repo memory note: `camp-grid-data-source.md`

## Scope
- Finish the trip-level camp grid experience.
- Support campsite dimensions, cell scaling, and preset selection.
- Support drag-and-drop item placement, movement, snapping, and selection.
- Support custom items and real-world dimensions.
- Support per-trip offline persistence with the existing local-first direction.
- Keep the layout ready for later shared sync if the product roadmap requires it.

## Non-Goals
- Do not redesign the overall trip dashboard here.
- Do not add unrelated module systems.
- Do not overbuild collision logic beyond what the current plan supports unless the team explicitly wants to move it forward.
- Do not convert the feature into a map or 3D planner.

## Key Product Requirements
- The grid must feel fast, tactile, and reliable on mobile.
- It should clearly represent campsite scale and item dimensions.
- The first-time setup flow should help users establish a usable layout quickly.
- Item placement, dragging, and snapping should be intuitive without requiring instruction-heavy UI.
- The experience must remain offline-first.

## Recommended Interaction Model
- User selects a festival preset or custom dimensions.
- The grid renders at the correct scale.
- User taps or drags items from the library into the layout.
- User can reposition, label, and refine items.
- User can return later and see the same layout restored.

## Dependencies
- Festival preset data must come from the documented source of truth.
- Grid persistence hooks or local storage must already be stable.
- The trip dashboard should route users into Camp Grid clearly.
- The layout must stay consistent with the current design system and mobile ergonomics.

## Acceptance Criteria
- A user can open Camp Grid and build a campsite layout from scratch.
- A user can add, move, and inspect items on the grid.
- The selected campsite dimensions render correctly.
- Progress survives leaving and reopening the screen.
- The feature feels production-grade on mobile, not like a prototype.

## Suggested Implementation Order
1. Lock the data and state model for the grid.
2. Finish the dimension/preset setup flow.
3. Complete grid rendering and item placement interactions.
4. Add custom item support and refine snapping behavior.
5. Harden persistence and offline reopen behavior.
6. Polish empty states, edit states, and visual feedback.

## Risks
- Gesture handling can get brittle on smaller screens if not tested carefully.
- Overly complex item controls can slow down the core workflow.
- If preset data drifts from the canonical festival dimensions, the user experience will become inconsistent.