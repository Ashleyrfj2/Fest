# FestNest documentation

This directory contains product and development documentation for the FestNest application.

## Product

Start here to understand the user experience and application model:

- `product/features.md` — product feature overview
- `product/design-spec.md` — UI and interaction design details
- `product/data-model.md` — application data model
- `product/onboarding.md` — onboarding flow
- `product/ui-decisions.md` — design decisions and conventions

## Setup

- `setup/supabase-setup.md` — local Supabase setup and development workflow
- `setup/auth-system.md` — authentication behavior and account flows

## Testing and quality

- `test-notes.md` — testing notes and known validation boundaries
- `user-side-audit-checklist.md` — user-facing QA checklist

## Public repository boundaries

The public repository intentionally excludes dated private session notes, machine-specific handoffs, accelerator/thesis working material, private sibling-repository coordination notes, and local credential/state files.

For local development, use values produced by your own local Supabase instance or your own hosted project. Do not commit access tokens, service-role keys, database credentials, OAuth secrets, or real `.env` files.
