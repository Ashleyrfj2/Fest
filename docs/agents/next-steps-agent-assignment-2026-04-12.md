# Next Steps Agent Assignment (April 12, 2026)

This file maps each active next step to the best available agent and provides a ready-to-run delegation prompt.

## Dispatch Progress

### Step 1: Food Planner dietary icons bug
- Best Agent: Food Planner Engineer
- Handoff Doc: docs/handoffs/food-planner-dietary-icons-handoff.md
- Status: ✅ Completed
- Result: fixed and verified
- Evidence:
  - components/FoodPlanner/MealCard.tsx
  - components/FoodPlanner/MealEditorModal.tsx
  - docs/test-notes.md
- Delegation Prompt:
  - Implement the handoff in docs/handoffs/food-planner-dietary-icons-handoff.md.
  - Fix the dietary icon question-mark rendering bug in Food Planner.
  - Keep data model unchanged.
  - Update docs/test-notes.md to mark the bug fixed with date.
  - Run TypeScript validation for touched files and report outcomes.

### Step 2: Travel QA audit
- Best Agent: Travel Module QA Engineer
- Handoff Doc: docs/handoffs/travel-qa-audit-handoff.md
- Status: ✅ Completed (initial QA FAIL, remediation verified PASS in Travel scope)
- Evidence:
  - docs/reports/travel-qa-audit-2026-04-12.md
- Delegation Prompt:
  - Execute the QA plan in docs/handoffs/travel-qa-audit-handoff.md.
  - Validate vehicle, flight, meetup map, and persistence flows.
  - Include back-navigation verification from Travel to Group main page.
  - Return severity-ranked findings with repro steps.

### Step 3: Safety PIN + Camp Grid auth/sync validation
- Best Agent: Senior QA Engineer
- Handoff Doc: docs/handoffs/safety-camp-grid-validation-handoff.md
- Status: ✅ Completed (QA result: FAIL)
- Evidence:
  - docs/reports/safety-camp-grid-validation-report-2026-04-12.md
- Delegation Prompt:
  - Execute the validation plan in docs/handoffs/safety-camp-grid-validation-handoff.md.
  - Focus on Safety emergency PIN lifecycle and Camp Grid auth transition sync behavior.
  - Prioritize reliability and data-integrity edge cases.
  - Return a severity-ranked report and exact follow-up tasks.

### Step 4: Lint gate implementation
- Best Agent: Full stack engineer
- Handoff Doc: docs/handoffs/lint-gate-handoff.md
- Status: ✅ Completed
- Evidence:
  - package.json
  - .eslintrc.cjs
  - .eslintignore
  - .github/workflows/lint.yml
- Delegation Prompt:
  - Implement docs/handoffs/lint-gate-handoff.md end-to-end.
  - Add ESLint baseline config, lint scripts, and CI workflow gate.
  - Keep config pragmatic for Expo + React Native + TypeScript.
  - Report file-level changes and run validation commands.

## Next Dispatch Order (Implementation)
1. Safety + Camp Grid targeted QA re-validation pass
  - Suggested agent: Senior QA Engineer
2. Safety emergency PIN local/remote fallback hardening (set/disable + unlock freshness)
  - Suggested agent: Privacy and security-minded mobile engineer
3. Camp Grid reliability follow-up polish (guard telemetry and UX refinement)
  - Suggested agent: Full stack mobile engineer with maps and collaboration
