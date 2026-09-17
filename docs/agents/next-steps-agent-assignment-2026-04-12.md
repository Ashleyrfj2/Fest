# Next Steps Agent Assignment (Updated after April 22, 2026 re-validation)

This file maps the current implementation checklist to the best-fit agent or agent pair and provides ready-to-run delegation prompts.

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
- Status: ✅ Re-validation completed April 22, 2026 (QA result: FAIL; Camp Grid P0 closed, Safety P1 cache/freshness issues remain)
- Evidence:
  - docs/reports/safety-camp-grid-validation-report-2026-04-12.md
  - docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md
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

## Current Implementation Checklist

### Item 1: Safety PIN local-to-remote rehydrate fallback
- Priority: P1
- Best Agent: Privacy and security-minded mobile engineer
- Support Agent: Senior QA Engineer
- Goal:
  - Allow `setEmergencyAccessPin` and `clearEmergencyAccessPin` to recover from a missing local encrypted row by rehydrating from the remote encrypted profile when available.
- Evidence / Context:
  - `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`
  - `docs/test-notes.md`
- Delegation Prompt:
  - Implement the April 22 Safety re-validation follow-up for local-to-remote PIN mutation recovery.
  - In `lib/hooks/useSafetyProfile.ts`, add a helper that resolves the encrypted owner profile from local storage first, then remote fallback.
  - If a remote encrypted profile exists, persist it locally, mark it synced, and continue the PIN update/clear flow.
  - Preserve fail-closed behavior when neither local nor remote encrypted data is available.
  - Update docs/test-notes.md with implementation notes and validation outcomes.

### Item 2: Safety stale-cache unlock mitigation
- Priority: P1
- Best Agent: Privacy and security-minded mobile engineer
- Support Agent: Senior QA Engineer
- Goal:
  - Prevent valid emergency PIN unlock failures when another device has rotated the PIN and local cache is stale.
- Evidence / Context:
  - `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`
  - `docs/test-notes.md`
- Delegation Prompt:
  - Implement the April 22 Safety re-validation follow-up for stale-cache emergency unlock.
  - In `lib/hooks/useSafetyProfile.ts`, add a remote refresh or refresh-on-hash-mismatch path for `unlockEmergencyProfile`.
  - Prefer newer remote encrypted data when online, but preserve offline unlock behavior by falling back to local verification when refresh is unavailable.
  - Keep the error surface safe and do not expose emergency payload details on failure.
  - Update docs/test-notes.md with implementation notes and validation outcomes.

### Item 3: Focused regression coverage for Safety and Camp Grid
- Priority: P2
- Best Agent: Full stack mobile engineer with testing focus
- Support Agents:
  - Privacy and security-minded mobile engineer
  - Senior QA Engineer
- Goal:
  - Add repeatable regression coverage around the remaining Safety and recently-fixed Camp Grid reliability paths.
- Evidence / Context:
  - `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`
  - `docs/test-notes.md`
- Delegation Prompt:
  - Add focused automated or harness-based regression coverage for:
    - Safety PIN preservation on normal save
    - Safety PIN set/update/disable when local encrypted row is missing
    - Safety emergency unlock after PIN rotation on another device
    - Camp Grid destructive-save guard after remote-load failure
  - Choose the lightest-weight test shape that fits the current project setup.
  - Document any remaining gaps if full automation is not practical yet.
  - Update docs/test-notes.md with what is now covered and what still requires manual replay.

### Item 4: Targeted Safety + Camp Grid QA closeout
- Priority: P2
- Best Agent: Senior QA Engineer
- Support Agent: Privacy and security-minded mobile engineer
- Goal:
  - Re-run the Safety + Camp Grid scope after the Safety fixes land and determine if the full scope can flip from FAIL to PASS.
- Evidence / Context:
  - `docs/handoffs/safety-camp-grid-validation-handoff.md`
  - `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`
- Delegation Prompt:
  - Re-run the Safety and Camp Grid validation scope after the PIN fallback and stale-cache mitigations are implemented.
  - Validate the prior April 22 failures, confirm no regression in Camp Grid guardrails, and report exact release readiness.
  - Return a severity-ranked report with repro steps for any remaining issues.

### Item 5: Camp Grid polish and observability follow-up
- Priority: P3
- Best Agent: Full stack mobile engineer with maps and collaboration
- Support Agent: Senior QA Engineer
- Goal:
  - Improve Camp Grid UX around blocked sync states and capture any remaining polish after the data-loss guard fix.
- Evidence / Context:
  - `docs/reports/safety-camp-grid-revalidation-report-2026-04-22.md`
  - `docs/product/feature-completion.md`
- Delegation Prompt:
  - Review the Camp Grid retry/blocked-sync experience after the April 22 guard fix.
  - Tighten copy, retry affordances, and any lightweight telemetry or logging hooks that would help diagnose future sync failures.
  - Keep the destructive-save protection behavior intact.
  - Document recommendations separately if the work should remain outside the current release scope.

## Recommended Dispatch Order
1. Item 1 and Item 2 in sequence with the same primary engineer, keeping Senior QA Engineer involved for acceptance criteria review.
2. Item 3 after the Safety fixes land so regression coverage matches final behavior.
3. Item 4 as the release gate.
4. Item 5 only after release-blocking Safety work is closed or intentionally deferred.
