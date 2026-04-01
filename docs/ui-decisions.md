# FestNest UI Decisions & Design Direction

## Aesthetic Direction

### Color System
- **Base:** Deep indigo-black (#0E0C16) — warm, not sterile
- **Surface:** Elevated dark (#151220, #1C1829, #252033)
- **Primary accent:** Burnished gold (#C9A84C) — premium, warm, not generic amber
- **Text hierarchy:** #EAE6DE (primary) → #A9A2B4 (mid) → #6E6880 (dim) → #3E3950 (faint)
- **Borders:** Extremely subtle (rgba white at 3-4% opacity)

### Festival Identity Colors
Each enrolled festival owns a unique gradient:
- **Electric Forest:** Greens (#0A4D3A → #12785A → #28C896)
- **Dancefestopia:** Violets (#3B1578 → #6D30CC → #B47AFF)
- **Beyond Wonderland:** Pinks (#7A1048 → #C42070 → #F280B0)

These are used on festival cards, progress bars, and accent elements to make groups instantly recognizable.

### Typography
- System fonts (SF Pro / Helvetica Neue) for now — will evaluate custom fonts (Satoshi, General Sans, or similar) during development
- Weight hierarchy: 800 for headlines, 700 for card titles, 600 for labels, 400 for body
- Tight letter-spacing on headlines (-.04em), wide tracking on section labels (.14em uppercase)
- Font sizes: 26px app title, 17px card names, 13px body, 10-11px labels/meta

### Design Principles
- **No emoji as icons** — use Lucide React icon set throughout (verified imports only)
- **No AI-slop patterns** — no purple-on-white gradients, no generic card grids, no cookie-cutter layouts
- **Layered depth** — gradient washes + radial glows behind cards, not flat solid backgrounds
- **Micro-interactions** — staggered fade-in on load, hover scale on cards, color transitions
- **Phone-first** — all mockups rendered inside a realistic iPhone 15 Pro frame (393×852, Dynamic Island, rounded corners)

## Navigation Architecture

### Level 1: App Home
- **What it shows:** All enrolled festivals, community announcements, app updates
- **Bottom nav:** Home, Discover, + Create, Activity, Profile
- **Festival cards:** Countdown, progress bar, crew avatars, role badge, attention alerts
- **Community feed:** Admin-curated posts (lineup drops, festival news, scene updates)
- **App updates:** Horizontal scroll cards with feature spotlights ("You can now X in the Y section")

### Level 2: Trip Dashboard (per festival)
- **Entered by:** Tapping a festival card on App Home
- **What it shows:** Module grid with progress, crew activity feed, attention banner, overall readiness
- **Design status:** Layout designed but not yet built as mockup

## Mockup Status

| Screen | Status | Notes |
|---|---|---|
| App Home (Level 1) | In progress | Layout and hierarchy solid, aesthetic being refined |
| Trip Dashboard (Level 2) | Designed, not built | Information hierarchy decided (action-first vs timeline-first vs social-first — TBD) |
| Camp Grid | In progress | Live route with grid dragging, library drag-to-place, rotation, custom items, and explicit group save |
| Lineup Scheduler | Not started | Voting UI with group consensus view |
| Budget Tracker | Not started | Settle-up summary focus |

## What to Avoid

- Emoji as UI icons (use Lucide or custom SVG)
- Generic amber/orange on pure black
- Evenly-distributed rainbow color schemes
- Uniform card sizes with identical layouts
- DaisyUI or other component library defaults
- Inter, Roboto, Arial, or system-default font stacks in final product
- Circular avatars (use rounded squares — feels more modern)
