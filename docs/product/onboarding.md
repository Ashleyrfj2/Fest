# FestNest Onboarding Flow

## Core Principles

- **30-second join rule** — new member goes from tapping a link to being inside the group in under 30 seconds
- **No login wall on entry** — show the group first, ask for identity second
- **Ghost accounts** — device-tied account created silently; email/phone prompted after 5+ min in the group
- **Show before ask** — invite screen shows group name, festival, dates, member count before asking for a name
- **Safety profile is soft-prompted, not forced** — shown as a banner after the user has explored 2+ modules
- **Notifications asked after value** — never on first open; triggered after user taps into 2+ modules

## Path 1: Joining via Invite Link

### Step 1 — Tap invite link
- Link format: `festnest.app/join/EF2026-xyz`
- If app not installed: opens App Store / Play Store with deep link preserved
- If installed: opens directly to invite screen
- Do not show login wall here

### Step 2 — Set name + color
- Display name field (autofocused, keyboard up immediately)
- Avatar color picker (8 preset colors, one tap)
- No email, password, or phone at this step
- CTA: "Save your spot" (not "Sign Up")

### Step 3 — See the group
- Land directly on trip dashboard
- All modules visible as cards
- Activity feed already showing what others have done
- Subtle animation/confetti on first join
- Empty states: leader's modules show "Set up" CTAs; joiners see "Leader is setting this up" placeholders

**Planned guest-demo change**
- Unregistered guests should eventually see this dashboard in read-only demo mode only.
- Module cards should be visible but non-interactive until registration/sign-in is complete.
- This planned restriction is not implemented yet.

### Step 4 — Fill in safety profile (soft prompt)
- Banner: "Add your emergency info so your crew can help if needed"
- Skippable; re-prompted once per session until complete
- Short form: emergency contact name, phone, allergies (medications optional)
- Copy: "Your info is only visible to your group"

### Step 5 — Enable notifications
- Never ask on first open
- Trigger after user has tapped into 2+ modules
- Custom pre-prompt screen before OS dialog
- Frame: "Get notified when the camp layout changes or someone claims a supply item"

## Path 2: Creating a New Trip (Leader)

### Step 1 — Start a new trip
- Home screen: two CTAs — "Create a trip" and "Join with a link"
- 3-field form: trip name, festival name (with type-ahead suggestions), start + end dates
- If known festival selected: offer to pre-load campsite dimensions + starter packing list

**Planned guest restriction**
- Guests should eventually be blocked from this create-trip flow until they register or sign in.

### Step 2 — Set leader profile
- Same display name + avatar color screen as join path
- Leader role auto-assigned
- Optional: set a group outfit theme (Fantasy, Space, Y2K, etc.)

### Step 3 — Invite the group
- Invite link shown immediately with large "Share" button
- One-tap share: iMessage, WhatsApp, Instagram DM, copy link
- Leader sets link expiry: 24h, 7 days, or never
- QR code option for in-person sharing
- Link preview includes trip name so it's recognizable in a chat
- **Get group in first, set up modules second**

### Step 4 — Set up first module
- "Start with one thing" prompt — not all modules at once
- Suggests camp grid (if camping) or supply list (if day festival)
- Completing one module sends activity feed update to new joiners
- Progress ring on dashboard shows setup completion %

### Step 5 — Assign module leads (optional, post-join)
- Shown once 2+ members have joined
- Roles: food lead, camp lead, safety lead, travel lead
- Leads get editor permissions on their module only
- Push notification: "Jordan made you the food lead for Electric Forest 2026"
