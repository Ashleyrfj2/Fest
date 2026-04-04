# Trip Creation & Invite System

## Overview

The core collaboration foundation for FestNest - users can create trips, generate invite links, and join via invite codes.

## Features Implemented

### 1. Trip Creation
**Screen:** `app/trips/create.tsx`

Users can create a new festival trip with:
- Trip name (e.g., "Squad's Electric Forest 2026")
- Festival name (with type-ahead suggestions for popular festivals)
- Start and end dates (YYYY-MM-DD format)
- Automatic leader assignment
- Unique 8-character invite code generation
- Shareable invite link

**Flow:**
1. Tap "Create Trip" button on home screen
2. Fill in trip details
3. Submit → trip is created
4. User is added as leader in `group_members`
5. Activity log entry created
6. Redirect to trip dashboard

### 2. Trip Dashboard (Level 2)
**Screen:** `app/trips/[id].tsx`

Per-trip view showing:
- Trip name, festival, dates
- Countdown to festival
- Crew list with roles and avatar colors
- Share invite button (native share sheet)
- Settings menu (leader only)
- 9 module cards with multiple implemented module routes now wired from dashboard

**Modules displayed:**
- Camp Grid - Design campsite layout
- Supply List - Who's bringing what (implemented)
- Food Planner - Plan meals
- Travel - Rides & meetup plans (implemented)
- Lineup - Vote on artists
- Packing - Track what you packed (implemented)
- Safety - Emergency info (implemented)
- Budget - Track & split expenses
- Collaboration - Manage crew and permissions (implemented)

### 2.1 Activity Tab (Cross-Trip)
**Screen:** `app/(tabs)/activity.tsx`

Per-user cross-trip feed showing:
- Recent `activity_logs` entries across all trips where the user is a member
- Grouped date sections (Today/Yesterday/older)
- Pull-to-refresh and realtime updates
- Tap-through to the associated trip dashboard

### 3. Invite System
**Utilities:** `lib/invites/invite-utils.ts`

Functions for invite code management:
- `generateInviteCode()` - Creates unique 8-char alphanumeric code
- `generateInviteUrl(code)` - Builds shareable URL
- `isValidInviteCode(code)` - Validates format
- `isInviteExpired(expiresAt)` - Checks expiry
- `generateInviteExpiry(days)` - Creates expiry date

**Invite links format:**
- Production: `https://festnest.app/join/[CODE]`
- Dev: `http://localhost:8081/join/[CODE]`

### 4. Join Flow
**Screen:** `app/join/[code].tsx`

User taps invite link → sees preview → joins trip:
1. Load trip by invite code
2. Validate code format and expiry
3. Show trip preview (name, festival, dates, member count)
4. Check if already a member
5. Join button → add to `group_members` as viewer
6. Log activity
7. Redirect to trip dashboard

**States handled:**
- Loading
- Invalid code
- Expired invite
- Already a member (redirect to dashboard)
- No session (prompt to create account)
- Success (join and redirect)

### 5. Home Screen Integration
**Screen:** `app/(tabs)/index.tsx`

Updated to show real trips:
- Loads user's trips from database via `group_members` join
- Shows trip cards with gradient backgrounds (festival-specific colors)
- "Create Trip" button in section header
- Empty state when no trips
- Loading state while fetching
- Tappable cards → navigate to trip dashboard

**Trip cards display:**
- Trip name
- Festival name
- Dates (formatted)
- Countdown (days until arrival)
- Member count
- User's role (leader/editor/viewer)
- Festival-specific gradient backgrounds

### 6. Deep Linking
**Configuration:** `app.json`

Universal Links / App Links configured for:
- iOS: Associated domains for festnest.app
- Android: Intent filters for https://festnest.app/join/*
- Deep link scheme: `festnest://`

**Usage:**
- Tap `https://festnest.app/join/ABCD1234` in any app
- iOS/Android automatically opens FestNest app
- Navigates to join screen with pre-loaded trip data

## Database Operations

### Trip Creation
```sql
INSERT INTO trips (name, festival_name, start_date, end_date, leader_id, invite_code)
INSERT INTO group_members (user_id, trip_id, role)
INSERT INTO activity_logs (trip_id, user_id, action_type, description)
```

### Join Trip
```sql
SELECT * FROM trips WHERE invite_code = ?
INSERT INTO group_members (user_id, trip_id, role = 'viewer')
INSERT INTO activity_logs (trip_id, user_id, action_type, description)
```

### Load Trips
```sql
SELECT trips.*, group_members.role
FROM trips
JOIN group_members ON trips.id = group_members.trip_id
WHERE group_members.user_id = ?
ORDER BY trips.start_date ASC
```

## Security

- **Invite codes:** Cryptographically secure random (crypto-random-string)
- **RLS policies:** Users can only see trips they're members of
- **Role-based access:** Leader/editor/viewer permissions enforced
- **Expiry support:** Invite links can expire after N days (currently set to permanent)

## File Structure

```
lib/
  invites/
    invite-utils.ts          # Code generation & validation

app/
  trips/
    create.tsx               # Create trip form
    [id].tsx                 # Trip dashboard
  join/
    [code].tsx               # Invite landing page
  (tabs)/
    index.tsx                # Home screen (updated with trip list)

app.json                     # Deep link configuration
```

## Testing the Flow

### Create Trip Flow
1. Open app → tap "Create Trip" on home screen
2. Enter trip details:
   - Name: "Squad's Electric Forest 2026"
   - Festival: "Electric Forest" (type-ahead)
   - Dates: 2026-06-19 to 2026-06-22
3. Tap "Create Trip"
4. Should redirect to trip dashboard
5. Verify trip appears on home screen

### Invite Flow
1. On trip dashboard → tap share icon
2. Copy invite link or share via messaging app
3. Open in new browser/device/incognito
4. Should see trip preview with details
5. Tap "Join Trip"
6. If logged in → joins immediately
7. If not logged in → prompts to create account
8. Redirects to trip dashboard

### Deep Link Flow
1. Generate invite link: `festnest://join/ABCD1234`
2. Send via iMessage/WhatsApp
3. Tap link → app should open automatically
4. Should navigate to join screen with trip preview

## Next Steps

1. **Finish Remaining Modules** - Food Planner, Lineup, Budget
2. **Trip Settings** - Edit trip, manage members, transfer leadership, leave trip
3. **Collaboration Approval Queue Backend** - replace current safe UI stub with real table + flows
4. **Progress Tracking** - Calculate % complete based on module completion
5. **Notifications** - Push notifications for invites, member joins, activity
6. **Invite Expiry UI** - Allow leaders to set custom expiry dates
7. **QR Code Sharing** - Generate QR codes for in-person invite sharing

## Known Limitations

- Invite links are permanent (expiry logic exists but not exposed in UI)
- Food, Lineup, and Budget module cards still route to coming-soon behavior
- No trip editing after creation
- Collaboration approval queue backend is not implemented (screen is intentionally stubbed)
- Progress calculation not implemented
