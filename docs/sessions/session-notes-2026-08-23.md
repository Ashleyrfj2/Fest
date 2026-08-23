# Session Notes — 2026-08-23

## 15:57 CDT — Thesis documentation audit corrections

### Scope

Audited the Festival thesis-demo documentation against the August 23 canonical Notion thesis and the current Demo/Festival implementation evidence. This session changed documentation only; no runtime code, migrations, databases, credentials, or synthetic data were modified.

### Updated files

- `docs/thesis-demo/FESTIVAL_CLAIM_CATALOG.md`
  - replaced the former `FEST-CLAIM-08` source-independence statement with a real Festival behavioral claim: a non-owner trip member cannot pack another member's claimed canopy and authoritative state remains unchanged after denial;
  - clarified that source independence belongs to Demo's evidence-reconciliation layer rather than the Festival behavioral claim vocabulary;
  - documented the canonical deterministic role matrix: `leader=leader`, `editor-a=editor`, `viewer-b=viewer`, `late-tester-d=editor`.
- `docs/QA_PLATFORM_INTEGRATION.md`
  - removed the developer-specific `/Users/...` browser-build path and uses `$FESTIVAL_REPO_ROOT`;
  - corrected local service-port semantics: Supabase API `54321`, Festival PostgreSQL `54322`, Studio `54323`, local inbox `54324`, Demo PostgreSQL `54332`;
  - aligned the source-of-truth reading order with the current Demo canonical MVP and experiment docs.

### Evidence checked

Before making the corrections, the audit cross-checked:

- `lib/hooks/useSupplyList.ts`;
- `supabase/migrations/20260830000000_authoritative_supply_mutations.sql`;
- `supabase/config.toml`;
- `scripts/demo/seed-demo.mjs`;
- the canonical Demo/Notion thesis, architecture, roadmap, experiment, and accelerator-demo definitions.

The authoritative supply transition RPC verifies that only the current owner can pack/unpack a claimed item and emits a database-owned denial audit on rejected transitions, so the replacement `FEST-CLAIM-08` is supported by the current controlled Festival behavior.

### Current thesis boundary

Festival remains the controlled source application and evidence environment. Demo remains the **Validation-Evidence System of Record + Information-Value Router** and owns claim identity, evidence contexts, observation linkage, reconciliation, routing, correction history, and experiment metrics.

The corrected docs continue to treat Gate 1–3 as verified infrastructure and the claim ledger/reconciliation/router as the post-Gate-3 implementation layer.
