# Docs Index

## Latest Status (April 22, 2026)

- Completed:
  - Food Planner dietary icon bug fix is implemented and verified.
  - Lint gate baseline is implemented (`lint`, `lint:fix`, CI workflow).
  - Travel QA blocker remediation is implemented and verified:
    - Viewer write restrictions are enforced in Travel UI and mutation paths.
    - Meetup pin realtime subscription is wired on `trips` updates.
  - Safety/Crypto TypeScript cleanup is implemented and verified (`npx tsc --noEmit` passes).
  - Safety emergency PIN field-preservation remediation is implemented and verified.
    - Normal safety profile saves preserve encrypted emergency PIN fields.
    - Save flow fails closed on inconsistent partial emergency PIN field state.
  - Agent dispatch planning docs and handoff briefs are in place.
- QA completed with updated outcome:
  - Safety + Camp Grid re-validation closed the Camp Grid destructive-save blocker.
  - Safety emergency PIN reliability still has two open medium-severity issues.
- Current focus:
  1. Complete remaining Safety reliability hardening (PIN fallback/rehydration + stale-cache unlock mitigation).
  2. Add focused regression coverage for Safety PIN and Camp Grid destructive-save guard paths.
  3. Re-run targeted Safety/Camp Grid QA after the Safety fixes land.

See the latest reports:
- `reports/travel-qa-audit-2026-04-12.md` (includes April 20 remediation update)
- `reports/safety-camp-grid-revalidation-report-2026-04-22.md`

See the latest session summary:
- `sessions/session-notes-2026-04-20.md`

Documentation is organized by purpose:

- `product/` — product and system specs
  - `data-model.md`
  - `design-spec.md`
  - `feature-completion.md`
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
