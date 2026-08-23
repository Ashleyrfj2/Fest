# QA Platform Integration Guide

This document describes how the Festival application integrates with the vendor-neutral QA Platform Demo.

---

## 1. Overview & Role

Festival serves as the real, rendered source application for the QA Platform thesis MVP. The unpacked Chrome Extension captures unscripted user interactions from the Festival DOM in browser sessions and transmits telemetry to the Demo API.

- **Target Application**: Festival (React Native / Expo Web Export)
- **Browser Build Command**:
  ```bash
  cd /Users/ashley/code/Festival
  node scripts/export-browser-app.mjs
  ```
- **Local Application Target**: `http://127.0.0.1:4173`
- **Controlled Integration Route**: `/trips/10000000-0000-4000-8000-000000000001/camp-grid`
- **Controlled Interaction Target**: `<BUTTON role="button">Start Building</BUTTON>`

---

## 2. Integration Verification Status

The live cross-repository Gate 3 integration between Festival and Demo was **successfully verified on August 23, 2026** (**STATUS: PASS**).

### Verified Chain:
1. Real Festival rendered DOM on `http://127.0.0.1:4173/trips/10000000-0000-4000-8000-000000000001/camp-grid`
2. Unpacked Chrome Extension capture-phase listener (`useCapture=true`)
3. Extension event normalization & durable queue
4. Authenticated Demo API delivery (`http://127.0.0.1:8080/api/v1/events`)
5. Demo PostgreSQL candidate scope canonicalization & `validation_events` persistence
6. Queue drain to 0 and session correlation verification

---

## 3. Trust Boundaries & Database Isolation

The Festival repository and Demo repository operate across strict, independent trust boundaries:

1. **Festival Application Database (`postgres/Supabase` on `127.0.0.1:54321`)**:
   - Stores Festival trip data, camp items, user profiles, and invites.
   - Must remain running on port `54321` for the rendered application.
2. **Demo QA Database (`qa_platform` on `127.0.0.1:54332`)**:
   - Owned by the Demo repository.
   - Stores validation events, candidate states, and sufficiency recommendations.

### Mandatory Rules:
- Festival does **not** own or store Demo telemetry persistence, candidate-state semantics, extension bearer tokens, or Demo database tables.
- **NEVER** copy Supabase URLs, keys, JWTs, database credentials, migrations, or reset commands between Festival and Demo.
- Never hardcode environment credentials or secrets in documentation or source files.

