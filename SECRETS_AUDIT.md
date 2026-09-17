# Public-release secrets audit

**Audit date:** September 17, 2026

## Scope

This audit covers the public-release Git snapshot and the branch history reachable from the rewritten public branches.

## Remediation completed

- Replaced the repository history with a new clean root snapshot so previously committed credential material is not part of the public branch ancestry.
- Removed private/internal handoff, session, thesis, local-machine, and career-analysis documents that were not needed for the public repository.
- Removed the real hosted Supabase project identifier and dashboard URLs from tracked files.
- Kept real environment files and local secret-bearing tooling excluded by `.gitignore`.
- Kept service-role keys, database credentials, OAuth secrets, and provider tokens environment-driven rather than hardcoded.

## Public configuration that is safe to track

The repository may contain:
- Localhost URLs and ports
- Environment-variable names
- Placeholder values in `.env.example`
- Supabase local-development configuration
- Database schema and RLS policy definitions

These are configuration or implementation details, not active credentials.

## Secret-handling rules

Never commit:
- Supabase personal/access tokens
- Supabase service-role keys
- Database passwords or credential-bearing connection strings
- OAuth client secrets
- GitHub, Notion, OpenAI, Anthropic, Slack, or other personal/API tokens
- Real `.env` files
- Local Claude/Codex settings that may contain credentials
- Generated database state, browser traces, or test artifacts containing user data

## External credential note

A Supabase access token had appeared in the repository before this public-release history rewrite. The token value is intentionally not reproduced here. Any credential that has ever been committed should be treated as exposed and revoked/rotated at the provider even after Git history is rewritten.

## Release disposition

The tracked public snapshot contains no intentionally stored secret values. Provider-side revocation of any historically exposed credential remains a required account-security practice because Git hosting systems may retain inaccessible caches or pull-request objects outside normal branch ancestry.
