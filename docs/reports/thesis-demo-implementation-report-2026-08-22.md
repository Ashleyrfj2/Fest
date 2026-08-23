# Thesis Demo Local V1 Implementation Report — 2026-08-22

> **Expert-audit correction, 17:20 CDT (Updated 23:45 CDT):** This report records historical narrow implementation and smoke-test receipts. Gate 1 evidence authority, Gate 2 PostgreSQL lifecycle/freeze enforcement (Demo PR #6), and Gate 3 stale proxy HTTP composition (Festival PR #8) have since been verified. Live browser DOM + unpacked Chrome extension exercise remains outstanding. See `thesis-demo-expert-audit-2026-08-22.md` and `docs/sessions/session-notes-2026-08-22.md`.

## Outcome

The bounded synthetic canopy handoff is implemented across Festival and the sibling Demo repository. Festival owns the controlled application state and source evidence. Demo owns normalized evidence, reconciliation, routing, UI, corrections, and metrics.

No production endpoint or customer data was used. Safety/Emergency is excluded. The generated experiment artifact is a synthetic wiring fixture, not a completed human baseline/guided study.

## Verified Festival behavior

- Reset creates four confirmed synthetic users with leader, editor, viewer, and editor roles; one stable trip; and canopy, stakes, first-aid kit, and water records.
- Consecutive resets reproduce fingerprint `7d1385137cf6f12fa326000ead9e86fbe71f9907959a62aba62b3501e4bdc06a`.
- Two independent signed-in browser sessions observe the shared canopy claim and packed transition.
- Viewer deletion is denied at the database boundary and the canopy remains present.
- The demo-only stale proxy suppresses exactly the first canopy refresh after packing, then restores the persisted packed state.
- The activity adapter emits deterministic normalized events from reviewed action types and never forwards activity descriptions.

## Validation receipts

| Command | Result |
| --- | --- |
| `npm run lint -- --no-cache` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — 41 tests |
| `npm run test:browser` | PASS — 5 tests |
| `npm run test:demo-proxy` | PASS — 1 test |
| `npm run test:demo` | PASS — local Supabase/RLS handoff |
| `npm run test:demo-browser` | PASS — two live browser sessions |
| `./scripts/demo/reset-demo.sh` | PASS — canonical fingerprint restored |

Sibling Demo validation also passed Go unit tests, frontend and extension builds, Docker/PostgreSQL startup, API restart persistence, immutable-event rejection, correction replay, and the synthetic experiment exporter.

## Remaining operator work

- Load and exercise the unpacked extension manually with the fixed local scope.
- Run equally timeboxed human `festival-baseline-001` and `festival-guided-001` sessions.
- Freeze metrics at each run boundary and capture screenshots/recording without secrets or sensitive content.
- Present the thesis conclusion only after empirical run results satisfy the predeclared comparison rule.
