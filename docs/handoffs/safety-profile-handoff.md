# Safety Profile Handoff

## Owner
Privacy/security-minded mobile engineer.

## Goal
Build the Safety / Emergency Info module so each user can manage their own emergency profile, with strong privacy expectations and offline-friendly behavior.

## Why This Is Next
This is one of the highest-trust features in the product. The docs describe it as self-owned, encrypted, and offline-cached, so it deserves careful implementation after the main trip collaboration surfaces are established.

## Source Context
- [Design spec](../product/design-spec.md)
- [Data model](../product/data-model.md)
- [Onboarding and safety prompt flow](../product/onboarding.md)
- [Feature ideas and offline-first guidance](../product/features.md)
- [Session notes](../sessions/session-notes-2026-03-19.md)

## Scope
- Build the self-owned safety profile UI.
- Allow each user to edit their own full name, phone, hometown, emergency contact, allergies, medications, blood type, and notes.
- Keep the editing surface private and clearly explained.
- Support offline-cached viewing and editing where the product expects it.
- Ensure the feature aligns with the app’s privacy model and trip membership rules.

## Non-Goals
- Do not create group-editable safety records.
- Do not add unnecessary social or collaboration affordances.
- Do not expand into generic profile settings; this is emergency info only.
- Do not introduce unsafe sharing behavior.

## Key Product Requirements
- The user must understand that this is private, self-owned information.
- The UI should make it obvious who can see or edit the data.
- The module should be accessible from the trip context and potentially from safety prompts.
- Offline access should remain a first-class behavior.
- Any encryption or protection strategy must be treated as a core requirement, not a later enhancement.

## Dependencies
- Existing safety profile entity from the data model.
- Authenticated or device-bound user identity.
- Trip membership context for where the profile is being used.
- Existing onboarding soft-prompt strategy for encouraging completion.

## Acceptance Criteria
- A user can create and update their own safety profile.
- The module clearly communicates privacy and ownership.
- The stored data remains scoped to the user and trip as intended.
- The feature works in the offline-friendly model described in the docs.
- The UI feels calm, trustworthy, and consistent with the rest of the app.

## Suggested Implementation Order
1. Define privacy copy and information architecture.
2. Build the form and summary states.
3. Wire save/load behavior with the correct ownership rules.
4. Add offline behavior and trust messaging.
5. Validate from the trip and onboarding entry points.

## Risks
- Overexposing sensitive information in the interface.
- Confusing self-owned safety data with group-level trip data.
- Treating encryption or offline support as optional instead of required.