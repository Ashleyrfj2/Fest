1. Password fields should keep the visibility toggle pattern where it makes sense, especially in auth and account-upgrade flows.
2. Date entry still needs a friendlier picker/autofill flow in the trip creation flow; that UX is not solved yet.
3. Profile save no longer depends on a blank Guest value, but unique usernames are still an open product question.
4. Delete account remains backend-only work; the frontend has confirmation UI but no destructive server flow yet.
5. Notifications and Appearance settings are scaffolded in the UI but still need real persistence and app-wide wiring.
6. The settings route tree now exists under /settings, with subpages for Notifications, Privacy & Account, Appearance, and Help & Support.
