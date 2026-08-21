# FestNest Positioning for Environment Engineer Roles

## Recommended framing

Describe this project as:

> An original, agent-assisted full-stack mobile application concept that I designed and directed end-to-end: product definition, system design, data model, shared-state architecture, offline-capable modules, QA remediation, and review of AI-generated implementation across a Supabase-backed planning app.

That framing is accurate to:

- your clarification that the app idea and deep planning were your own
- the repository evidence showing full-stack architecture, schema, auth, realtime, offline storage, and QA docs
- the local Git history showing sustained ownership of the repo

## Why this project fits the role

The role description emphasizes:

- end-to-end environment ownership
- full-stack rebuilds of realistic systems
- deterministic state, contracts, and failure modes
- use of coding agents in parallel
- quality review and expert-like iteration

FestNest maps well to that because the repo shows:

1. **Original environment/product definition**
   - You had the original concept and planning direction.
   - Evidence: user clarification, `docs/product/*.md`, `docs/handoffs/*.md`, `docs/sessions/*.md`

2. **Full-stack stateful system design**
   - The project includes client UX, relational schema, auth, permissions, realtime, offline persistence, and synchronization logic.
   - Evidence: `app/`, `lib/hooks/*.ts`, `lib/sqlite/*.ts`, `supabase/migrations/*.sql`

3. **Deterministic contracts and invariants**
   - The repo encodes permission rules, RLS, split calculations, sync guards, PIN validation, and destructive-save protections.
   - Evidence: `supabase/migrations/20260319000001_rls_policies.sql`, `lib/hooks/useBudgetTracker.ts`, `lib/sqlite/useCampGridDB.ts`, `lib/hooks/useSafetyProfile.ts`

4. **Agent-directed implementation**
   - Your clarification says most implementation was completed through agents under your direction.
   - Evidence: user clarification, `.github/agents/`, extensive handoff and audit docs

5. **Environment-quality debugging and review**
   - The repo contains detailed QA notes, remediation cycles, and follow-up validation work, especially around sync and security edge cases.
   - Evidence: `docs/test-notes.md`, `docs/reports/*.md`, commits `7cd282f`, `c0aef1f`, `8fcf4b1`, `444f9ba`

## Strongest role-aligned claims

These are the strongest claims to reuse in interviews, summaries, or cover letters.

### 1. You designed the system, not just features

Good version:

> I defined the app concept, module structure, data model, and collaboration flows, then directed agent-assisted implementation across the client, Supabase schema, permissions, and offline storage layers.

Why it fits:

- emphasizes ownership
- avoids false sole-manual-coding claims
- matches repo evidence

### 2. You worked on realistic multi-step state, not toy CRUD

Good version:

> The app coordinates shared trip state across invites, roles, realtime updates, offline caches, encrypted safety data, and destructive-sync edge cases.

Why it fits:

- resembles “real business state” language from the role
- grounded in actual repo behavior

### 3. You used agents as leverage, not as a substitute for judgment

Good version:

> I used coding agents for much of the implementation, but kept ownership of planning, architecture, QA, and deciding whether failures were product issues, sync issues, or implementation artifacts.

Why it fits:

- directly matches the job’s “leverage” expectation
- turns agent usage into a strength instead of something to hide

### 4. You care about invariants and reliability

Good version:

> I spent a meaningful amount of time hardening invariants around permissions, sync safety, and encrypted safety-profile flows rather than only adding surface features.

Why it fits:

- matches “determinism, invariants, and contracts”
- supported by the repo’s QA and remediation history

## What to emphasize from this repo

Prioritize these themes:

1. **System design**
   - schema, roles, routes, shared-state model

2. **Stateful workflow realism**
   - invites, group membership, trip modules, progress, safety, budgeting

3. **Offline and sync complexity**
   - SQLite caches, merge/load decisions, destructive-save blocking

4. **Security-minded logic**
   - RLS, self-owned safety data, local encryption, PIN flows

5. **Agent orchestration**
   - multi-agent implementation with your planning/review layer

6. **QA and failure analysis**
   - bug audits and targeted fixes

## What not to emphasize

Do not lead with:

- “I built a festival app” by itself
- placeholder settings/help screens
- unimplemented roadmap items like weather, mesh networking, or live festival mode
- claims that imply all code was manually written by you

## Suggested short summary

Use a summary like this near the top of a resume, portfolio note, or interview doc:

> Designed and directed an agent-assisted full-stack mobile planning app with Supabase auth, realtime collaboration, offline SQLite modules, encrypted safety data, and role-based group workflows. Owned the product plan, architecture, QA remediation, and review of generated implementation across a realistic multi-step shared-state system.

## Suggested interview framing

If asked what you personally did:

> The product idea, module design, system planning, and architecture were mine. I used coding agents heavily for implementation speed, but I owned the technical direction, the repo, the quality bar, and the debugging. A lot of the real work was deciding how shared state, offline behavior, permissions, and failure cases should work, then validating and correcting the generated code.

If asked why this matters for environment work:

> It’s close to environment engineering because the hard part wasn’t just adding screens. It was defining realistic state, encoded rules, and failure modes, then using AI agents to help build the system while I kept control of the contracts and review loop.

## Best evidence to cite quickly

- Working backend architecture: `lib/supabase.ts`, `supabase/migrations/*.sql`
- Role-based auth and gating: `lib/auth/AuthContext.tsx`, `app/_layout.tsx`
- Offline/sync complexity: `lib/sqlite/useCampGridDB.ts`, `lib/sqlite/safetyDb.ts`, `lib/hooks/usePackingListLocal.ts`
- Security/data ownership: `lib/crypto/safetyEncryption.ts`, `supabase/migrations/20260319000001_rls_policies.sql`
- QA/reliability work: `docs/test-notes.md`
