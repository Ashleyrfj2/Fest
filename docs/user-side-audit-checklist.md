# Festival User-Side Audit Checklist

Snapshot date: April 10, 2026

## Engineering Delta (April 10, 2026 - Verified)

Safe-area hardening was applied after this checklist snapshot and has now been validated in the current build:

- Added app-level SafeAreaProvider in root app layout.
- Added SafeAreaView wrappers across tab screens, auth screens, onboarding, and join flow.
- Updated shared SettingsPageFrame to apply SafeAreaView to all settings pages.
- Updated Food Planner meal editor modal to full-screen presentation with explicit in-modal safe-area context.
- Updated Budget screen to use react-native-safe-area-context SafeAreaView with top edges.

Validation results:

- [x] Verified Food Planner modal header buttons (X and Save) are tappable under iOS status/notch area.
- [x] Verified no status-bar overlap on tabs/auth/onboarding/join/settings routes.
- [x] Verified no double top inset or excessive top spacing on Food Planner modal.
- [x] Verified Budget header is fully visible and interactive on notch devices.

This checklist is for auditing Festival from the user side only: tapping through the app, creating and joining trips, using modules, and recording what is working, broken, partial, or not built yet.

## How To Use This

- Treat unchecked items as the ones that still need your hands-on audit.
- A pre-checked `[x]` means "skip for now": the repo already makes this status clear enough that you probably do not need to spend manual QA time on it yet.
- If you manually verify a pre-checked item anyway and the app contradicts the repo read, note that as a docs/status mismatch.
- If something fails, note whether it is a bug, bad UX, misleading copy, or an unfinished feature.
- Use these result labels in your notes: `PASS`, `FAIL`, `PARTIAL`, `NOT BUILT`, `BLOCKED`.
- When possible, test each flow as both a leader and a non-leader.
- If possible, test with two accounts/devices so sharing, realtime updates, and role differences can be checked.

## Pre-Marked Skip Items

These are the clearest repo-confirmed items that you can usually skip during manual audit unless you specifically want polish feedback.

- [x] Discover tab is currently a placeholder screen
- [x] Known bug already confirmed: Food Planner dietary flag icons currently render as question marks instead of correct icons
- [x] Previously reported Packing Checklist top safe-area overlap issue is verified fixed in the current build
- [x] Previously reported bottom menu/tab routing issue is verified fixed in the current build
- [x] Sign-in forgot password flow is not implemented yet
- [x] Trip dashboard leader settings action is still "coming soon"
- [x] Lineup import is not built yet
- [x] Travel advanced map behavior is not fully built yet: multiple pins and route-overlap/cross-path markers are still future enhancements
- [x] Camp Grid collision detection is still planned, not finished
- [x] Camp Grid export/share is still planned, not finished
- [x] Settings > Notifications is local UI state only and not wired to persistence/permissions/backend
- [x] Settings > Appearance is local UI state only and not wired app-wide
- [x] Settings > Privacy > Delete account needs a secure backend delete flow
- [x] Help > FAQ content is still "coming soon"
- [x] Help > Privacy policy content is still "coming soon"

## Current Build Read

This is the repo-based status read before manual QA. Your audit should confirm or correct it.

### Looks implemented and worth full hands-on QA now

- Auth entry points: welcome, guest setup, email registration, sign-in
- Home tab
- Activity tab
- Profile screen
- Trip creation
- Invite join flow
- Trip dashboard
- Collaboration / crew management
- Supply List
- Food Planner
- Travel
- Lineup
- Packing Checklist
- Safety Profile
- Budget
- Privacy / Account basics
- Help / Support basics

### Looks implemented but still likely to need focused QA

- Camp Grid: docs still call it in progress even though the route exists
- Travel: docs explicitly recommend full QA sign-off
- Lineup: shipped, but lineup import is still not built
- Packing Checklist: screen exists, but the feature index still says "planned", so docs/status may be stale
- Food Planner: dietary flag icon rendering bug has already been reported
- Bottom navigation: continue light regression monitoring after route/safe-area fixes

### Looks partial, scaffolded, or intentionally unfinished

- Discover tab is currently a placeholder screen
- Settings > Notifications is local UI state only, not persisted and not wired to permissions/backend
- Settings > Appearance is local UI state only, not app-wide
- Help > FAQ and Privacy Policy content are still "coming soon"
- Privacy > Delete account needs a secure backend delete flow
- Trip dashboard leader settings button is "coming soon"
- Sign-in forgot password flow is "coming soon"
- Invite URL generation still has a TODO to swap in the production domain

### Likely copy/content mismatch to verify during audit

- Home screen "What's New" content mentions outfit voting as live, while product notes say outfit voting was deferred out of Travel

## Test Setup

- [ ] Confirm app launches cleanly from a fresh cold start
- [ ] Confirm app relaunches cleanly after force close
- [ ] Confirm there is at least one leader account available for testing
- [ ] Confirm there is at least one second account/device for member testing
- [ ] Confirm at least one empty/new trip and one populated trip can be tested
- [ ] Confirm network-on testing is possible
- [ ] Confirm limited/offline testing is possible for offline-first areas

Notes:

## Bottom Tab Navigation

Current build read: previously reported non-Home tab routing issue is validated as resolved; continue regression checks.

- [x] Previously reported bug: non-Home bottom menu/tab icons not routing correctly appears resolved in current build validation
- [x] Verified fix affects all non-Home tabs tested in current validation pass
- [x] Verified issue was not present after current fixes and rebuild

Notes:

## Entry, Auth, and Identity

Current build read: Implemented, with forgot password still not built.

- [ ] Welcome screen loads without layout or safe-area issues
- [ ] "Get started instantly" opens guest setup
- [ ] "Create account with email" opens registration
- [ ] "Already have an account? Sign in" opens sign-in
- [ ] Guest setup creates a usable ghost account
- [ ] Guest setup saves display name and avatar color
- [ ] Guest setup continues into the app without dead ends
- [ ] Email registration works with valid inputs
- [ ] Email registration shows useful validation errors for bad inputs
- [ ] Email confirmation behavior is understandable if confirmation is required
- [ ] Sign-in works with a saved account
- [ ] Sign-in shows helpful error text for invalid credentials
- [x] Forgot password is clearly marked as not built, not silently broken
- [ ] Onboarding / set-profile saves name and color correctly
- [ ] Returning users keep identity and do not get bounced into the wrong flow

Notes:

## Home Tab

Current build read: Implemented. Content accuracy should be checked, not just navigation.

- [ x] Home loads trips without crashing
- [ x] Empty state is correct when the user has no trips
- [x ] Existing trips render correctly with names, dates, role, and counts
- [x ] Tapping a trip opens the correct trip dashboard
- [ x] "Create Trip" opens the create flow
- [ x] Settings button opens Settings
- [ x] Email prompt banner behavior feels intentional
- [ x] Community cards render correctly and do not link to broken flows
- [x] Repo review already flags at least one likely stale "What's New" claim: outfit voting is presented as live even though product notes defer it
- [ x] No obviously stale or misleading marketing copy appears on this screen

Notes:

## Discover Tab

Current build read: Placeholder only.

- [x] Confirm whether this tab is intentionally placeholder
- [x] Confirm it does not promise features that do not exist
- [x] Decide whether it should remain visible in production in its current state

Notes:

## Activity Tab

Current build read: Implemented.

- [ x] Activity tab loads without crashing
- [ x] Empty state is clear when there is no activity
- [x ] Feed groups entries by time correctly
- [ x] Relative timestamps feel reasonable
- [x ] Tapping an activity item opens the correct trip
- [ ] Pull to refresh works
- [ ] Error state is understandable and recoverable

Notes: Pull to refresh needs implemented

## Trip Creation

Current build read: Implemented.

- [ ] Create Trip screen opens correctly
- [ ] Form validates missing trip name
- [ ] Form validates missing festival name
- [ ] Form validates bad date formats
- [ ] Form validates start date after end date
- [ ] Festival suggestions appear when expected
- [ ] Selecting a suggested festival fills dates correctly
- [ ] Trip creation succeeds
- [ ] Creator is added as leader automatically
- [ ] App lands on the new trip dashboard after creation
- [ ] New trip appears back on Home
- [ ] Invite code / sharing works after trip creation

Notes:

## Invite Join Flow

Current build read: Implemented, but invite URL domain should be verified.

- [ ] Invite link opens the invite landing screen
- [ ] Invite landing shows correct trip preview details
- [ ] Invalid invite code shows a clear error state
- [ ] Expired invite shows a clear error state
- [ ] Guest user is routed into guest setup, then joined automatically
- [ ] Signed-in user can join directly
- [ ] Existing member sees the "already in" flow instead of duplicate failure
- [ ] Joined user lands on the correct trip dashboard
- [ ] Joined member appears in crew/members lists
- [ ] Shared invite URL uses the expected domain and opens correctly

Notes:

## Trip Dashboard

Current build read: Implemented. Leader settings are still not built.

- [x ] Dashboard loads the correct trip data
- [ x] Back navigation works
- [x ] Trip title, festival name, and dates are correct
- [x ] Countdown / days-until feels correct
- [ x] Progress / readiness summary loads
- [ x] Crew section shows the correct members and roles
- [ x] Activity section shows recent trip activity
- [ x] Every module card opens the correct route
- [ x] Share invite button works
- [x] Leader-only settings affordance behaves intentionally and is clearly marked if unfinished
- [ x] Empty/loading/error states feel complete, not broken

Notes:

## Collaboration / Crew

Current build read: Implemented.

- [ ] Crew screen opens from the dashboard
- [ ] Members list shows leader/editor/viewer accurately
- [ ] Leader badge is visually distinct
- [ ] Invite sharing works from this screen
- [ ] Leader can change a member's role
- [ ] Leader can transfer leadership
- [ ] Leader can remove a member
- [ ] Module lead assignment works for Food, Camp, Safety, and Travel
- [ ] Non-leader users do not see controls they should not use
- [ ] Any approval queue UI/state is understandable if present

Notes:

## Supply List

Current build read: Implemented.

- [ ] Supply List opens from the dashboard
- [ ] Empty state is clear
- [ ] New supply item can be added
- [ ] Item quantity works correctly
- [ ] Category selection works correctly
- [ ] Assignment to a person works correctly
- [ ] Claim flow works correctly
- [ ] Packed flow works correctly
- [ ] Status is easy to understand at a glance
- [ ] Duplicate item handling is visible and useful
- [ ] Editing/deleting items works if allowed
- [ ] Role restrictions behave correctly
- [ ] Changes are visible to other members after refresh/reopen

Notes:

## Food Planner

Current build read: Implemented.

- [ ] Food Planner opens from the dashboard
- [ ] Empty state explains what to do next
- [ ] Meal days render correctly
- [ ] New meals can be added
- [ ] Meal fields save correctly
- [ ] Editing a meal works
- [ ] Deleting a meal works
- [ ] Day/slot organization is clear
- [ ] Any ingredients or linked list behavior works as expected
- [x] Known bug already confirmed: dietary flag icons are incorrect and currently render as question marks
- [ ] Role restrictions behave correctly
- [ ] Data persists after leaving and reopening

Notes:

## Travel

Current build read: Implemented and should receive full QA sign-off.

- [ ] Travel screen opens without safe-area or scroll issues
- [ ] Empty states for vehicles, flights, and meetup map feel intentional
- [ ] Add vehicle modal opens with all fields visible
- [ ] Add vehicle saves correctly
- [ ] Edit vehicle works correctly
- [ ] Delete vehicle works correctly
- [ ] Add flight modal opens with all fields visible
- [ ] Add flight saves correctly
- [ ] Edit flight works correctly
- [ ] Delete flight works correctly
- [ ] Passenger assignments work correctly
- [ ] Meetup map loads without crashing
- [ ] Tapping map creates a meetup pin
- [ ] Pin label, notes, and type can be saved
- [ ] Marker press opens the detail sheet correctly
- [ ] Dragging or moving the pin updates location correctly
- [ ] Non-creator / non-owner behavior is correct and understandable
- [ ] Data persists after leaving and reopening
- [ ] Realtime updates between members behave correctly if supported
- [x] Multiple pins are not built yet and should be treated as future enhancement work, not a current QA failure
- [x] Route-overlap / cross-path markers are not built yet and should be treated as future enhancement work, not a current QA failure

Notes:

## Lineup

Current build read: Implemented, but lineup import is not built yet.

- [ ] Lineup screen opens without layout bugs
- [ ] Empty state is clear when no artists exist
- [ ] Artists can be added manually
- [ ] Artist cards render correctly
- [ ] Vote states like Must See / Want to See / Skip work correctly
- [ ] Consensus / group matching updates correctly
- [ ] Conflict warnings appear when expected
- [ ] Schedule builder behaves correctly
- [ ] "Who's going?" signal behavior is understandable and works if exposed
- [ ] Manual lineup data persists after leaving and reopening
- [x] Absence of lineup import is clearly a missing feature, not a broken one

Notes:

## Packing Checklist

Current build read: Implemented in app, but docs still say planned. Audit both feature behavior and documentation mismatch.

- [ ] Packing Checklist opens from the dashboard
- [x] Previously reported top safe-area overlap in Packing Checklist appears resolved in current build validation
- [ ] Starter/template list loads correctly
- [ ] Categories render correctly
- [ ] Progress indicators update correctly
- [ ] Personal items can be added
- [ ] Group items can be added
- [ ] Group items can be assigned to a member
- [ ] Packed toggle works correctly for personal items
- [ ] Packed toggle works correctly for group items
- [ ] Deleting items works correctly
- [ ] Expanded/collapsed category state feels stable
- [ ] Role restrictions behave correctly
- [ ] Data persists after leaving and reopening

Notes:

## Safety Profile

Current build read: Implemented. This is a high-trust flow and should be checked carefully.

- [ ] Safety Profile opens from the dashboard
- [ ] Privacy/ownership messaging is clear
- [ ] User can create their own profile
- [ ] User can edit their own profile
- [ ] Required and optional fields behave correctly
- [ ] Sensitive fields save correctly
- [ ] Other users cannot edit someone else's safety data
- [ ] Read/view permissions match product expectations
- [ ] Data persists after app restart
- [ ] Offline-friendly behavior is acceptable for this high-priority flow

Notes:

## Budget

Current build read: Implemented.

- [ ] Budget screen opens from the dashboard
- [ ] Empty state is clear
- [ ] Expense can be added
- [ ] Amount entry and formatting are correct
- [ ] Category selection works correctly
- [ ] Payer selection works correctly
- [ ] Split logic works correctly
- [ ] Edit expense works correctly
- [ ] Delete expense works correctly
- [ ] Settle-up summary is understandable
- [ ] Totals update correctly after changes
- [ ] Data persists after leaving and reopening

Notes:

## Camp Grid

Current build read: Route exists, but docs still treat this module as in progress. Expect a mix of working functionality and remaining product gaps.

- [ ] Camp Grid opens from the dashboard
- [ ] Orientation behavior feels intentional when entering/leaving the screen
- [ ] Initial empty/setup flow is understandable
- [ ] Festival presets can be selected
- [ ] Custom dimensions can be entered
- [ ] Grid renders at a believable scale
- [ ] Item library is usable
- [ ] Tap-to-add items works
- [ ] Drag-to-place items works
- [ ] Drag-to-move existing items works
- [ ] Rotation works for library items and placed items
- [ ] Custom item creation works
- [ ] Item dimensions/labels are understandable on screen
- [ ] Save layout action works
- [ ] Local persistence works after leaving and reopening
- [ ] Offline reopen behavior is acceptable
- [x] Any missing collision handling is documented as not built, not mistaken for a bug
- [x] Any missing export/share behavior is documented as not built, not mistaken for a bug

Notes:

## Profile, Settings, and Account Management

Current build read: Mostly implemented, with several clearly unfinished sub-features.

### Profile

- [ x] Profile screen loads current account info correctly
- [ x] Display name can be edited
- [ x] Avatar color can be changed
- [x ] Phone number can be saved
- [ x] Ghost vs saved account state is displayed correctly
- [ x] Upgrade-to-email flow works for ghost accounts
- [ x] Invite friends/share invite works from profile
- [ x] Sign out works and returns to the correct auth screen

Notes:

### Settings Home

- [ x] Settings home opens correctly
- [ x] Rows navigate to the correct sub-pages
- [ x] Sign out works from settings

Notes:

### Notifications

Current build read: UI scaffold only.

- [x] Screen loads correctly
- [x] Toggles visually work
- [x] Disabled/enabled states make sense
- [x] It is obvious these settings are local-only and not fully implemented
- [x] Decide whether this is acceptable for current release state

Notes:

### Appearance

Current build read: UI scaffold only.

- [x] Screen loads correctly
- [x] Theme, density, and text size controls visually work
- [x] Preview updates correctly
- [x] "Apply app-wide later" makes it clear the feature is not fully wired
- [x] Decide whether this is acceptable for current release state

Notes: Safe-area overlap issue is resolved in the current validated build.

### Privacy & Account

Current build read: Mostly implemented, except delete account backend flow.

- [ x] Account status is accurate
- [ x] Email row is accurate for ghost vs saved accounts
- [ x] Upgrade modal works if account is still ghost
- [ ] Phone/manage profile links go to the correct place
- [ x] Sign out works correctly
- [x] Delete account is clearly marked as unfinished, not silently broken
- [x ] Privacy policy action behaves intentionally

Notes:

### Help & Support

Current build read: Basic support actions work, but FAQ/privacy content is incomplete.

- [ x] Help screen opens correctly
- [ ] Feedback email action opens mail correctly
- [ ] Report a problem opens mail correctly
- [ ] Contact support opens mail correctly
- [x] FAQ "coming soon" state is acceptable if still unfinished
- [x] Privacy policy "coming soon" state is acceptable if still unfinished
- [ ] Version/build info is accurate

Notes: 

## Cross-Cutting Quality Checks

- [x] Safe-area handling is correct across all screens
- [ ] Scrolling never hides content behind top bars or bottom bars
- [x] Modals/bottom sheets show full content and usable buttons
- [ ] Keyboard does not cover important form fields or submit actions
- [ ] Loading states feel intentional
- [ ] Empty states feel intentional
- [ ] Error states explain what happened and how to recover
- [ ] Confirmations appear for destructive actions
- [ ] Back navigation works consistently
- [ ] Copy tone is consistent with the product
- [ ] No placeholder or "coming soon" surfaces appear in places that should feel shipped
- [ ] Realtime or refresh behavior feels consistent where expected
- [ ] Data persists correctly after app restart
- [ ] Role-based permissions are consistent across modules
- [ ] Any offline-first promises are actually true for Camp Grid and Safety
- [ ] User-facing copy matches actual shipped functionality

Notes: Using the back button or swiping to go back takes user back to the previous page in click history instead of the previous screen in the route. Going back takes the user through all modules in the order they were visited. Going back should take the user back to the previous main screen, example if user is on Lineup page: User swipes/clicks back > Goes to Group main page Swipe again > Back to the home page. Right now it is incorrectly going back like this: Lineup > user clicks/swipes back > Packing List > user clicks/swipes back > Camp grid. 

## Audit Summary Template

- Audit date:
- Tester:
- App build / branch:
- Devices tested:
- Accounts/roles tested:
- Flows that passed:
- Flows that failed:
- Flows that are partial but usable:
- Flows that are clearly not built yet:
- Highest-priority fixes:
- Docs/status mismatches found:
