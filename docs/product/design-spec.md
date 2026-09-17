# FestNest Design Specification

> Platform: iOS + Android (React Native). Permission tiers: Leader / Editor / Viewer.

## Module Details

### 1. Interactive Camp Grid (P1, Hero Feature)

- Set campsite dimensions (e.g. 20ft × 30ft) — grid auto-scales to screen
- Drag-and-drop item library: tents, canopies, cars, tables, coolers, fire pits, pathways
- Sidebar items support both tap-to-add and drag-to-place onto the grid
- Placed items can be dragged to new snapped positions after placement
- Rotate library items before placement and rotate placed items after selection
- Users can create custom items with a label, dimensions, color, and starting orientation
- Each item has real-world dimensions shown on grid
- Festival presets (e.g. "Electric Forest Camp A" pre-loads known lot dimensions)
- Assign items to people (e.g. Riley's 2-person tent)
- Grid snapping is implemented; collision detection is still planned
- Layout can be explicitly saved to the shared group database via a Save Layout action
- Export layout as PNG to share with the group is still planned
- **Must work offline — no cell signal at most festivals**
- Current persistence decision: keep a local SQLite copy for offline reopen, then sync shared layouts through Supabase when the user saves

### 2. Collaboration + Permissions (P1)

- Leader generates shareable invite link (expiring or permanent)
- Joiners pick display name + avatar color on entry
- Module-level editor permissions (e.g. "food lead" only edits the menu)
- Approval queue: editors propose changes, leader approves/rejects
- Activity feed: "Riley updated the food menu · 2 min ago"
- Leader can remove members or transfer leadership

### 3. Who's Bringing What — Supply List (P1)

- Add items with quantity, category, and optional assignment
- Item status flow: Unassigned → Claimed → Packed
- Duplicate detection
- Categories: cooking, shelter, hygiene, medical, drinks, food, entertainment, misc

### 4. Food Menu Planner (P2)

- Day-by-day calendar (e.g. Thursday–Monday)
- 3–4 slots per day: breakfast, lunch, dinner, snacks
- Each meal: name, ingredients, cook, dietary flags, notes
- Ingredients auto-populate to the supply list
- One-tap duplicate meal

### 5. Travel Plans (P1)

- Add vehicles with driver, make/model, capacity
- Assign passengers to cars, set departure city + time
- Route with waypoints for pickups along the way
- Meetup pin: shared map point for the group to converge
- Flight details: flight number, airline, arrival airport + time, needs pickup flag
- Outfit photo upload with thumbs up/down voting
- Leader can set a group outfit theme

### 6. Lineup Scheduler (P2)

- Import lineup manually or from community source
- Each member marks artists: Must See / Want to See / Skip
- Group match view: highlights artists 3+ people said Must See
- Conflict detector: alerts when two must-sees overlap
- Group schedule builder from agreed artists
- "Who's going?" button for real-time meetup signals at the festival

### 7. Packing Checklist (P2)

- Pre-loaded categories: shelter, festival gear, clothing, hygiene, medical, kitchen, comfort
- Each member tracks their own packed state independently
- Group items (e.g. "one person brings the camp stove") assigned to one person
- Progress bar per person and per category

### 8. Safety + Emergency Info (P1)

- Full name, phone, hometown
- Emergency contact: name, relationship, phone
- Allergies: food, environmental, medication
- Current medications + dosages
- Blood type (optional)
- Free-text notes
- **Encrypted at rest, offline-cached on join, self-owned (not editable by others)**

### 9. Budget Tracker (P2)

- Shared ledger: log expenses with who paid, amount, category
- Split equally or with custom amounts per person
- Settle-up summary at end of trip
- Optional receipt photo
- Categories: food, supplies, fuel, activity, misc
- Amounts stored as integers (cents) to avoid float math bugs

## Permission Matrix

| Action | Leader | Editor | Viewer |
|---|---|---|---|
| Create / edit / delete anything | ✅ | ❌ | ❌ |
| Edit assigned modules | ✅ | ✅ | ❌ |
| Propose changes to locked modules | ✅ | ✅ | ❌ |
| Approve / reject changes | ✅ | ❌ | ❌ |
| Vote on outfits + artists | ✅ | ✅ | ✅ |
| Fill in own safety profile | ✅ | ✅ | ✅ |
| Manage members / transfer leadership | ✅ | ❌ | ❌ |

### Planned Guest Demo Restriction
- Unregistered guest accounts should eventually be limited to a read-only trip dashboard demo.
- Module entry and create/edit flows should remain blocked until registration or sign-in.
- This guest-demo tier is planned work and is not yet part of the current permission matrix.

## Tech Stack

- **Framework:** React Native (cross-platform iOS + Android)
- **Real-time sync:** Firebase or Supabase
- **Maps + routes:** Mapbox or Google Maps SDK
- **Invite system:** Deep links (Universal Links / App Links)
- **Storage:** Supabase Storage or S3 for outfit photos, receipts
- **Offline:** SQLite on device for camp grid + safety cards
- **Encryption:** End-to-end encryption for SafetyProfile data
