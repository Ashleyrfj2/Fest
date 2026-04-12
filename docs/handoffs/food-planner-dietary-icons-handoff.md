# Food Planner Dietary Icons Handoff

Status: ✅ Complete (April 12, 2026)
Owner Agent: Food Planner Engineer
Priority: High

## Goal
Fix the open Food Planner bug where dietary flag icons render as question marks on device.

## Why This Is Next
- This is the only explicitly open bug in the active QA notes for Food Planner.
- It is user-visible in core meal planning flows.
- It blocks confidence in shipping Food Planner as stable.

## Source of Truth
- docs/test-notes.md (Open Bugs section)
- docs/handoffs/feature-handoff-index.md

## Current Symptom
Dietary flag icons are displayed as "?" instead of intended icons in Food Planner UI.

## Code Areas To Inspect
- lib/foodPlannerTypes.ts
  - DIETARY_FLAG_METADATA currently uses emoji icon strings.
- components/FoodPlanner/MealCard.tsx
  - Renders dietary badges in meal cards.
- components/FoodPlanner/MealEditorModal.tsx
  - Renders selectable dietary options in the form.
- app/trips/[id]/food-planner.tsx
  - Verify the bug does not originate from data mapping in screen-level rendering.

## Implementation Guidance
1. Replace fragile emoji-based dietary icon rendering with deterministic icon rendering.
2. Prefer Lucide icons for UI consistency with project conventions.
3. Keep existing dietary labels and colors unless a change is needed for readability.
4. Maintain existing data model values for dietary_flags (do not migrate DB data).

## Acceptance Criteria
1. Dietary flags render consistently in both:
   - Meal card badges
   - Meal editor dietary selector
2. No question-mark glyphs appear on iOS and Android for dietary icons.
3. TypeScript compile for modified files is clean.
4. Existing save/edit meal behavior is unchanged.

## Validation Checklist
- Open Food Planner.
- Add a meal with multiple dietary flags.
- Confirm icons render in the modal while selecting.
- Save meal and confirm icons render correctly in meal card.
- Edit the same meal and confirm selected flags persist and render correctly.

## Out of Scope
- Meal slot icons (breakfast/lunch/dinner/snacks)
- Broader Food Planner redesign
- Data model/schema changes

## Deliverable
- Code fix in relevant files
- Brief QA note appended to docs/test-notes.md marking the bug fixed

## Completion Summary (April 12, 2026)

- Implemented deterministic Lucide icon rendering for dietary flags.
- Verified bug no longer reproduces in Meal Card and Meal Editor dietary UI.
- Data model remained unchanged.

Files updated:
- `components/FoodPlanner/MealCard.tsx`
- `components/FoodPlanner/MealEditorModal.tsx`
- `docs/test-notes.md`

Follow-up:
- No additional Food Planner blocker remains from this handoff.
