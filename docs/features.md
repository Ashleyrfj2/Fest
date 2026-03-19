# FestNest Feature Ideas & Suggestions

## In-Festival Live Mode (high value)

- App switches to live view when you arrive at the festival
- Real-time "where are you?" pings between group members on a simplified festival map
- Quick-message system: "Meet me at the [stage] side entrance"
- Last-seen location in case someone's phone dies
- Cell signal is brutal at festivals — research low-bandwidth mesh option

## Mesh / No-Signal Mode

- Uses Meshtastic hardware or Bluetooth phone-to-phone
- Messages hop between group members' phones when cell towers are overwhelmed
- Automatically kicks in when signal drops
- The whole crew stays connected no matter what
- Beta feature — requires testing at actual festivals

## Festival Profiles / Past Trips

- Save past festivals so users can duplicate a camp layout or supply list
- Electric Forest veterans would love "use my 2025 setup as a starting point"
- History builds long-term app stickiness

## Weather Integration

- Pull in forecast for festival dates and location
- "Saturday looks like rain" → pack ponchos, adjust camp layout for drainage
- Surface weather alerts on the trip dashboard

## Outfit Voting

- Photo uploads with thumbs up/down voting
- Leader can set a group outfit theme (Fantasy, Space, Y2K, etc.)
- Lives within the Travel module

## UX Decisions

### Onboarding Friction
- Join via invite link must be under 30 seconds, no account required
- Account creation framed as "save your spot" not "sign up"
- Email/phone prompt delayed until 5+ min in the group

### Notification Permission
- Never ask on first open
- Ask after user has tapped into 2+ modules
- Custom pre-prompt screen before OS dialog

### Empty States
- Leader's modules: "Set up" CTAs
- Joiner's view before leader sets up: "Leader is setting this up" placeholders
- A leader who sets up one module before the first member joins = much better first impression

### Offline-First Requirements
- Camp grid must work without cell signal
- Safety cards downloaded to device on join
- ActivityLog can sync when back online

## Monetization

- **Free tier:** 1 active trip, up to 6 members
- **Pro tier:** Unlimited concurrent trips, unlimited members, lineup import tools
- **Festival brand partnerships:** Electric Forest / Bonnaroo co-branded version with preloaded lot maps

## Supported Festivals (Examples)

- Electric Forest
- Dancefestopia
- Wookan
- Beyond Wonderland PNW
- Bonnaroo
- Any camping festival (custom dimensions supported)
