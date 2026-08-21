# Resume Section for Environment Engineer Roles

## Selected Project

**FestNest** | Original product concept, agent-directed implementation, full-stack mobile system  
React Native, Expo, TypeScript, Supabase, PostgreSQL, SQLite

Designed and directed an agent-assisted full-stack mobile planning app for coordinating group camping festival trips. Owned the product concept, system planning, data model, shared-state architecture, QA remediation, and review of generated implementation across client, backend, and offline storage layers.

- Designed the app concept, module structure, and technical plan, then directed implementation across trip creation, invite flows, authentication, collaboration, offline storage, and shared planning modules.
- Built a working Supabase-backed system with authentication, invite links, role-based permissions, row-level security, and realtime updates across travel, lineup, supply, food, budget, and activity flows.
- Defined and maintained a relational backend with 9 migrations covering users, trips, collaboration, planning modules, approval workflows, and security policies.
- Implemented offline-capable flows for camp layout, safety data, and packing lists using SQLite, including synchronization logic between local state and shared backend state.
- Hardened invariants around destructive sync behavior, safety-profile encryption, and emergency-PIN recovery, including fixes for stale-cache and missing-local-row edge cases.
- Used coding agents for much of the implementation while retaining ownership of architecture, debugging, QA review, and determining whether failures came from environment design, sync logic, or generated code.
- Added quality gates and remediation workflows through linting, TypeScript validation, structured QA notes, and repeated manual regression passes in simulated test environments.

## Optional Skills Line

Product/system design, agent orchestration, environment-style simulation design, Supabase schema/RLS, realtime collaboration, offline-first client state, QA and reliability hardening

## Interview Summary Version

I treated FestNest less like a simple feature app and more like a realistic shared-state system. The hard part was defining how identity, invites, permissions, offline caches, sync, and recovery flows should behave, then using coding agents to accelerate implementation while I kept ownership of the contracts, architecture, and QA loop.
