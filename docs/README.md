# Docs Index

## Latest Status (April 12, 2026)

- Completed:
  - Food Planner dietary icon bug fix is implemented and verified.
  - Lint gate baseline is implemented (`lint`, `lint:fix`, CI workflow).
  - Agent dispatch planning docs and handoff briefs are in place.
- QA completed with blockers:
  - Travel QA found role-permission and realtime gaps.
  - Safety + Camp Grid validation found critical/high reliability issues.
- Current focus:
  1. Camp Grid remote-load failure data-loss guard.
  2. Safety emergency PIN field-preservation fixes.
  3. Travel role restrictions and meetup realtime subscription fixes.
  4. Clear remaining TypeScript errors in safety files.

See the latest reports:
- `reports/travel-qa-audit-2026-04-12.md`
- `reports/safety-camp-grid-validation-report-2026-04-12.md`

See the latest session summary:
- `sessions/session-notes-2026-04-12.md`

Documentation is organized by purpose:

- `product/` — product and system specs
  - `data-model.md`
  - `design-spec.md`
  - `features.md`
  - `onboarding.md`
  - `trip-system.md`
  - `ui-decisions.md`
  - `stretch.md`
- `setup/` — setup and infrastructure guides
  - `auth-system.md`
  - `notion-mcp-setup.md`
  - `supabase-setup.md`
  - `testing-database.md`
- `handoffs/` — implementation handoff docs by feature
- `reports/` — implementation reports and checklists
- `sessions/` — dated session notes
- `modules/` — module-specific deep docs
  - `camp-grid/`

If you are starting a new feature, begin with `handoffs/feature-handoff-index.md`.