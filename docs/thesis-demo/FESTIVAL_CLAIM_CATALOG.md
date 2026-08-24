# Festival Thesis Demo — Claim Catalog

Last synchronized with Demo: 2026-08-24 CDT

This file defines the controlled behavioral claims used by the Festival accelerator demo. It is product/experiment ground truth for the demo, not a universal model of Festival and not a tester-facing checklist.

## Claim identity

Each claim follows the V1 identity model:

```text
ClaimDefinition = Target + StateSignature + ActorContext + ValidationIntent
```

Evidence for a claim is collected inside an `EvidenceContext`:

```text
EvidenceContext = Build + Environment + Tenant/Data Context
                + Feature Flags + optional Device/Region + time
```

A source observation may support, weaken, contradict, invalidate, or explicitly report inability to validate. A state visit alone does not make a claim Solid.

## Current Demo implementation status

The sibling Demo repository has completed M4A, M4B, M4C, and M4D. Claim persistence, Evidence Reconciliation V0, and the Build Validation / Evidence Ledger UI are implemented; M5A Information-Value Router V0 is next.

Current Demo milestone commits on `main`:

```text
31a5a18 feat: add evidence reconciliation v0
4d75c1f feat: add M4D evidence ledger UI (#9)
```

The catalog below remains the normative description of expected Festival behavior. Demo reconciliation must adapt to these claims; Festival behavior should not be rewritten to accommodate implementation quirks.

Resolved semantics relevant to this catalog:

1. compatible contradict-only evidence intentionally derives `Conflicted`, including without a supporting observation;
2. expected database-enforced `denied_mutation` may support claims 05/06/08; `Blocked` requires an explicit blocked assessment.

These semantics are implemented and covered by Demo tests.

## Browser-branch remediation status — August 24, 2026

Current implementation branch: `fix/browser-test-reliability`.

Implementation commits after `main`:

```text
afb3715  fix: harden browser workflow across macOS and WSL
d96d8e0  chore: align devcontainer with browser workflow
9b8e4cb  fix: harden browser workflow lifecycle
595d153  test: preserve browser secret-removal contract
e09b4db  test: retain ambient Supabase source guard
4c766e2  fix: bind browser identity to exported artifact
```

`4c766e295ec957b5d77c34649deb7ecf3bfd5532` is the executable implementation tip immediately before the documentation-only reconciliation commit containing this section.

Fest Actions **Lint run #49** (`32741534261`) completed successfully at `4c766e2`. The branch adds local-environment validation, bounded owned-process cleanup, fail-closed export readiness, ambient Supabase-source protection, and a deterministic export receipt.

Strict producer identity:

```text
schemaVersion    1
service          festnest-browser-export
buildId          festnest-demo-001
scenarioId       equipment-handoff-v1
controlledRoute  /trips/10000000-0000-4000-8000-000000000001/camp-grid
artifactId       sha256:<64 lowercase hex characters>
```

Festival owns the export process and cleanup. Demo is a strict consumer and never stops an existing listener. If these branches are merged, merge this Fest producer before the Demo consumer. No Supabase reset or seed, live browser run, repeated workflow, native-WSL replay, or live Festival → extension → Demo API → PostgreSQL composition was executed at the final implementation tips. The August 23 Gate 3 receipt remains historical. Codespaces manual forwarded-browser composition is unsupported unless separately implemented.

## Verification-depth scale

- **Depth 1 — Surface**: visual/DOM presence or shallow observation.
- **Depth 2 — Interaction**: an action or transition succeeds in the client.
- **Depth 3 — Persistence/backend**: authoritative persisted state is verified and survives reload/requery.
- **Depth 4 — Cross-system/asynchronous**: expected audit/webhook/async/system-side effect is verified.

The minimum depth below is the intended threshold for the controlled demo, subject to context compatibility, freshness, source independence, and conflict status.

## Controlled claim set

| ID | Behavioral claim | Target | StateSignature | ActorContext | ValidationIntent | Business risk | Minimum depth for Solid | Useful deeper/independent verifier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FEST-CLAIM-01` | A permitted leader/editor can create the shared canopy item in the controlled trip. | Supply List / canopy | item absent → item exists/unassigned | leader or editor member | `TransitionSucceeds` | Medium | 3 | UI action + persisted Supply List record/requery |
| `FEST-CLAIM-02` | A permitted member can claim an unassigned canopy and the assignment is shared with another signed-in session. | Supply List / canopy assignment | unassigned → claimed | permitted trip member | `DataPersistenceOnRefresh` | Medium | 3 | second browser session or backend requery sees authoritative assignee |
| `FEST-CLAIM-03` | The owner of a claimed canopy can mark it packed. | Supply List / canopy packing | claimed → packed | current item owner | `TransitionSucceeds` | Medium | 2 | activity/backend record for the packed mutation |
| `FEST-CLAIM-04` | A packed canopy remains packed after refresh/requery when authoritative state is current. | Supply List / canopy persistence | packed before reload → packed after reload | permitted trip member | `DataPersistenceOnRefresh` | High | 3 | Playwright refresh + backend/Supabase verification |
| `FEST-CLAIM-05` | A viewer cannot perform the controlled privileged delete mutation. | Supply List authorization | canopy exists → delete attempt denied, item remains | viewer member | `RolePermissionEnforcement` | High | 3 | database-owned denial result/audit + item still present |
| `FEST-CLAIM-06` | A denied privileged viewer mutation produces the expected immutable authorization evidence without exposing sensitive before/after payloads. | Supply List private denial audit | denied mutation → audit evidence exists | viewer member | `AuditEventCreated` | High | 4 | private database audit path normalized through Festival adapter |
| `FEST-CLAIM-07` | After the controlled stale/offline refresh condition ends, the client converges to the authoritative packed state. | Supply List realtime/reconciliation | stale client view → authoritative packed view | editor/late tester in controlled build | `DataPersistenceOnRefresh` | High | 3 | fresh browser requery plus authoritative persisted state |
| `FEST-CLAIM-08` | A trip member who does not own a claimed canopy cannot pack it, and the authoritative item state remains unchanged after the denied attempt. | Supply List ownership authorization | claimed by another member → pack attempt denied, item remains claimed | authenticated non-owner trip member | `RolePermissionEnforcement` | High | 3 | database-owned denial audit + authoritative item requery confirms unchanged state |

`FEST-CLAIM-08` is intentionally a **Festival behavior claim**. Source independence is evaluated by Demo's evidence-reconciliation layer and is not itself a behavioral claim in this catalog.

## How the accelerator demo should use these claims

The demo does not need to exercise all claims equally. Select the smallest sequence that demonstrates the product thesis clearly.

Recommended visible sequence:

1. Start with `FEST-CLAIM-04` as **Weak** after a human performs the pack action but persistence has not been verified.
2. Run Playwright/backend verification. If persisted state survives refresh, move the claim toward **Solid**; if authoritative evidence meaningfully disagrees, show **Conflicted**.
3. Keep `FEST-CLAIM-05`, `FEST-CLAIM-07`, or `FEST-CLAIM-08` **Untouched** or uncertain at the start.
4. Let the future information-value router recommend the higher-value remaining claim with explicit rationale.
5. Let `late-tester-d` accept or override the recommendation and record the reason.
6. Update the ledger and recommendation order from the resulting observation.

## Classification guardrails

Simple UI labels are derived from evidence dimensions rather than stored as primitive truth:

- **Solid** — sufficiently current/context-compatible evidence, adequate verification depth, and no unresolved hard conflict.
- **Weak** — shallow or low-confidence evidence.
- **Stale** — prior evidence weakened by change or context drift.
- **Conflicted** — credible observations meaningfully disagree; compatible contradict-only evidence is intentionally `Conflicted`, including without a supporting observation.
- **Untouched** — no relevant evidence for the required claim/context.
- **Blocked** — validation cannot currently be completed; an expected authorization denial is not inherently the same thing as blocked validation.

Do not automatically promote a claim to Solid because:

- a route was visited;
- a control was clicked;
- the same validator repeated the same check;
- multiple correlated agents used the same oracle;
- a UI success message appeared without persistence/backend verification when the claim requires it.

## Source-independence examples

Potentially useful independent combinations:

- human browser interaction + backend/Supabase assertion;
- human browser observation + Playwright persistence check;
- UI transition + database-owned authorization denial audit.

Potentially correlated observations:

- repeated identical Playwright runs;
- several agents using the same DOM assertion/oracle;
- repeated same-session visual checks with no new context or verification depth.

## Business-risk guidance for V0 routing

Use explicit/manual weights for the demo. Suggested relative ordering:

1. **High** — permission/ownership enforcement, persistence correctness, stale/reconciliation correctness.
2. **Medium** — normal create/claim/pack transitions and useful independent corroboration.
3. **Low** — shallow cosmetic behavior not required for the core demo.

The V0 router should recommend claims/areas, not click scripts.

## Controlled environment identifiers

```text
tenant_id       festival-thesis-demo
build_id        festnest-demo-001
environment_id  festnest-local-browser
scenario_id     equipment-handoff-v1
human actors    leader, editor-a, viewer-b, late-tester-d
agent actor     playwright-agent-c
```

Canonical deterministic Festival roles:

```text
leader         leader
editor-a       editor
viewer-b       viewer
late-tester-d  editor
```

These identifiers belong to the controlled local thesis environment and do not define the long-term product schema.

## Ownership

- Product/QA meaning, claim semantics, validation intent, business risk, and experiment ground truth are product/QA decisions.
- Demo owns technical persistence/linkage/reconciliation/routing implementation.
- Changes to claim identity, evidence thresholds, privacy boundaries, or what counts as proof should be reviewed jointly.

## Scope guardrail

This catalog is intentionally small. The accelerator demo should use approximately **6–10 claims**, not attempt universal semantic claim inference. Expand only when a new claim materially improves claim representation, evidence reconciliation, next-validation allocation, or experiment quality.
