# Thesis Demo Local V1 Implementation Report — 2026-08-22

> ## August 23, 2026 addendum — current interpretation
>
> This is a **historical August 22 implementation receipt**. Preserve the original observations and validation commands below, but do not use its old pending-status language as the current system state.
>
> **Gate 1, Gate 2, and Gate 3 are now PASS.** The final live Gate 3 verification proved the real Festival DOM → unpacked Demo Chrome MV3 extension → normalized event → durable queue → authenticated Demo Go API → candidate-scope canonicalization → Demo PostgreSQL persistence → exact session/event correlation path, with the extension queue draining to zero.
>
> Final Gate 3 receipt:
>
> - session: `session-gate3-final-1787473951348`
> - event: `6671ec3f-a50e-4ab0-9d7f-701701ed17ea`
>
> The product thesis was also refined on August 23. The current architecture is a **Validation-Evidence System of Record + Information-Value Router**. Candidate-state identity and the Gate 1–3 plumbing remain valid foundations, but a state visit is no longer the primary unit of product knowledge. The next layer is `ClaimDefinition + EvidenceContext + Observation`, followed by evidence reconciliation and explainable next-validation routing.
>
> For current instructions, use:
>
> 1. sibling Demo `docs/agent-logs/CURRENT.md`;
> 2. sibling Demo `docs/architecture.md`;
> 3. sibling Demo `docs/festival-virtual-qa-environment.md`;
> 4. Festival `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`;
> 5. Festival `docs/thesis-demo/festival-virtual-qa-environment.md`.

> **Expert-audit correction, 17:20 CDT (Updated 23:45 CDT):** This report records historical narrow implementation and smoke-test receipts. Gate 1 evidence authority, Gate 2 PostgreSQL lifecycle/freeze enforcement (Demo PR #6), and Gate 3 stale proxy HTTP composition (Festival PR #8) had been verified by the end of August 22. At the time this historical note was written, live browser DOM + unpacked Chrome extension exercise was still outstanding; that status was superseded by the successful August 23 Gate 3 verification documented in the addendum above.

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

## Historical next-work note from August 22

The bullets below reflect the end-of-day August 22 state and are retained as historical context. The first item was subsequently completed by the August 23 Gate 3 PASS.

- Load and exercise the unpacked extension manually with the fixed local scope. **Superseded: completed August 23.**
- Run equally timeboxed human `festival-baseline-001` and `festival-guided-001` sessions.
- Freeze metrics at each run boundary and capture screenshots/recording without secrets or sensitive content.
- Present the thesis conclusion only after empirical run results satisfy the predeclared comparison rule.

The current post-Gate-3 roadmap is broader than presentation polish: implement the claim ledger, evidence reconciliation, Build Validation UI, one deeper Playwright/agent source, transparent information-value routing, human accept/override feedback, and then the fixed-budget experiment.