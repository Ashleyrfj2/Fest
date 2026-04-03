# Trip Dashboard Navigation Flow

## Screen Hierarchy

```
┌─────────────────────────────────────────┐
│         Level 1: App Home               │
│      app/(tabs)/index.tsx               │
│                                         │
│  ┌─────────────────────────────┐       │
│  │  Festival Card (Trip)       │       │
│  │  • Trip Name                │       │
│  │  • Festival Name            │       │
│  │  • Countdown                │       │
│  │  • Progress Bar             │───────┼──┐
│  │  • Crew Avatars             │       │  │
│  │  • Role Badge               │       │  │
│  └─────────────────────────────┘       │  │
│                                         │  │
└─────────────────────────────────────────┘  │
                                             │ Tap festival card
                                             │ router.push(`/trips/${trip.id}`)
                                             ▼
┌─────────────────────────────────────────────────────────┐
│         Level 2: Trip Dashboard                         │
│         app/trips/[id].tsx                              │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ Header                                         │    │
│  │ [←]  Trip Name              [Share] [Settings] │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ Trip Identity                                  │    │
│  │ Trip Name (26px, weight 800)                   │    │
│  │ Festival Name (17px, gold)                     │    │
│  │ 📅 Jun 25 – Jun 28, 2026                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ QuickStatsHeader                               │    │
│  │  📅 14      👥 5       ✓ 0%                    │    │
│  │  days until  crew members  ready               │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ GET STARTED                                    │    │
│  │                                                │    │
│  │ ┌──────────────────────────────────────────┐   │    │
│  │ │ 📍 Camp Grid                             │   │    │
│  │ │    Design your campsite layout           │───┼────┼──┐
│  │ │    [START HERE badge]                    │   │    │  │
│  │ │    Progress: ████████░░ 75%              │   │    │  │
│  │ └──────────────────────────────────────────┘   │    │  │
│  └────────────────────────────────────────────────┘    │  │
│                                                         │  │
│  ┌────────────────────────────────────────────────┐    │  │
│  │ CREW (5)                           [+ Invite]  │    │  │
│  │                                                │    │  │
│  │  🟡 Ashley         leader                      │    │  │
│  │  🟢 Riley          editor                      │    │  │
│  │  🟣 Jordan         viewer                      │    │  │
│  │  🔵 Morgan         editor                      │    │  │
│  │  🔴 Taylor         viewer                      │    │  │
│  └────────────────────────────────────────────────┘    │  │
│                                                         │  │
│  ┌────────────────────────────────────────────────┐    │  │
│  │ ALL MODULES                                    │    │  │
│  │                                                │    │  │
│  │ 🛒 Supply List      🍴 Food Planner            │    │  │
│  │ 🚗 Travel           🎵 Lineup                  │    │  │
│  │ 🎒 Packing          🛡️ Safety                  │    │  │
│  │ 💰 Budget           👥 Collaboration           │    │  │
│  │                                                │    │  │
│  │ [Each shows "Coming Soon" badge]              │    │  │
│  └────────────────────────────────────────────────┘    │  │
│                                                         │  │
│  ┌────────────────────────────────────────────────┐    │  │
│  │ RECENT ACTIVITY                                │    │  │
│  │                                                │    │  │
│  │ ← Horizontal scroll →                          │    │  │
│  │                                                │    │  │
│  │ [Riley updated...] [Ashley created...] [...]   │    │  │
│  └────────────────────────────────────────────────┘    │  │
│                                                         │  │
└─────────────────────────────────────────────────────────┘  │
                                                             │ Tap Camp Grid card
                                                             │ router.push(`/trips/${id}/camp-grid`)
                                                             │ + Lock to landscape
                                                             ▼
┌─────────────────────────────────────────────────────────┐
│         Level 3: Camp Grid Editor                       │
│         app/trips/[id]/camp-grid.tsx                    │
│                                                         │
│  [Landscape orientation, full implementation]          │
│  • Grid with dimensions                                │
│  • Item library (drag to place)                        │
│  • Placed items (drag to reposition)                   │
│  • Rotation controls                                   │
│  • Save to group database                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Trip Dashboard Components

```
app/trips/[id].tsx
├── Header
│   ├── Back Button (←)
│   ├── Share Button (Share invite link)
│   └── Settings Button (Leader only)
│
├── Trip Identity Section
│   ├── Trip Name (Display from trips table)
│   ├── Festival Name (Display from trips table)
│   └── Date Range (start_date – end_date)
│
├── QuickStatsHeader
│   ├── Days Until (Calculated countdown)
│   ├── Crew Size (Count of group_members)
│   └── Completion % (Calculated from module progress)
│
├── Primary Module Section
│   └── ModuleCard (Camp Grid, isPrimary: true)
│       ├── "START HERE" badge
│       ├── Larger size (56x56 icon vs 48x48)
│       ├── Gold border (2px vs 1px)
│       └── Progress bar
│
├── CrewSection
│   ├── Header with member count
│   ├── Invite Button (Leader only)
│   └── Member Cards (mapped from group_members)
│       ├── Avatar (rounded square, colored)
│       ├── Display Name
│       └── Role (leader/editor/viewer)
│
├── All Modules Section
│   └── ModuleCards (mapped from MODULES array)
│       ├── Supply List (🛒, gold)
│       ├── Food Planner (🍴, violet)
│       ├── Travel (🚗, blue)
│       ├── Lineup (🎵, pink)
│       ├── Packing (🎒, amber)
│       ├── Safety (🛡️, coral)
│       ├── Budget (💰, lavender)
│       └── Collaboration (👥, dim gold)
│
└── ActivityFeed
    └── Activity Cards (horizontal scroll)
        ├── User Indicator (colored dot)
        ├── User Name
        ├── Description
        └── Relative Time
```

## Data Flow

```
┌──────────────────────┐
│   Supabase Tables    │
└──────────────────────┘
         │
         │ Fetch on mount
         │ useEffect(() => { loadTripData() }, [id])
         ▼
┌──────────────────────┐
│   React State        │
│                      │
│  • trip: Trip        │
│  • members: []       │
│  • activities: []    │
│  • isLoading: bool   │
└──────────────────────┘
         │
         │ Props passed to components
         ▼
┌──────────────────────────────────────┐
│         Component Render             │
│                                      │
│  QuickStatsHeader({                  │
│    daysUntil: calculated,            │
│    crewSize: members.length,         │
│    completionPercent: calculated     │
│  })                                  │
│                                      │
│  CrewSection({                       │
│    members: members,                 │
│    isLeader: currentMember.role,     │
│    onInvite: handleShareInvite       │
│  })                                  │
│                                      │
│  ActivityFeed({                      │
│    activities: activities,           │
│    emptyMessage: "No activity yet"   │
│  })                                  │
│                                      │
│  ModuleCard({                        │
│    module: MODULES[i],               │
│    onPress: handleModulePress        │
│  })                                  │
└──────────────────────────────────────┘
```

## Permission-Based UI Variations

### Leader View
```
┌──────────────────────────────┐
│ [←] Trip Name  [Share] [⚙️]  │  ← Settings visible
└──────────────────────────────┘

CREW (5)              [+ Invite]  ← Invite button visible
```

### Editor/Viewer View
```
┌──────────────────────────────┐
│ [←] Trip Name      [Share]   │  ← No settings button
└──────────────────────────────┘

CREW (5)                         ← No invite button
```

## State Variations

### Loading State
```
┌─────────────────────┐
│                     │
│   Loading trip...   │
│                     │
└─────────────────────┘
```

### Error State (Trip Not Found)
```
┌─────────────────────┐
│  Trip not found     │
│                     │
│  [Back to Home]     │
└─────────────────────┘
```

### Empty Activity State
```
┌──────────────────────────────────────┐
│ RECENT ACTIVITY                      │
│                                      │
│  No activity yet. Start by setting   │
│  up your camp!                       │
└──────────────────────────────────────┘
```

## Module Priority & Color Coding

| Priority | Modules | Visual Treatment |
|----------|---------|------------------|
| **Hero** | Camp Grid | 2px gold border, "START HERE" badge, 56px icon |
| **P1** | Supply List, Travel, Safety, Collaboration | Standard card, 48px icon |
| **P2** | Food, Lineup, Packing, Budget | Standard card, 48px icon |

## Color Palette by Module

```
Camp Grid:      #28C896 (Electric Green)  ← Primary module
Supply List:    #C9A84C (Burnished Gold)
Food Planner:   #6D30CC (Violet)
Travel:         #4A9EFF (Sky Blue)
Lineup:         #F280B0 (Hot Pink)
Packing:        #FFB84D (Amber)
Safety:         #FF6B6B (Coral)
Budget:         #B47AFF (Lavender)
Collaboration:  #9B8340 (Dim Gold)
```

Each color is applied to:
- Icon color
- Icon background (color at 20% opacity)
- Progress bar fill

## Responsive Behavior

### Portrait (Default)
- Vertical scroll
- Full-width cards
- Activity feed: horizontal scroll within vertical layout
- Optimized for one-hand use

### Landscape (Camp Grid only)
- Auto-locked via `ScreenOrientation.lockAsync()`
- Full-screen grid editor
- Item library sidebar
- Optimized for two-hand layout design

## Navigation Guard Pattern

```javascript
function handleModulePress(moduleId: string) {
  if (moduleId === 'camp_grid') {
    // Special handling for implemented module
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    router.push(`/trips/${id}/camp-grid`);
    return;
  }

  // Placeholder for unimplemented modules
  const module = MODULES.find((m) => m.id === moduleId);
  Alert.alert(
    module?.name || 'Coming Soon',
    `${module?.name} coming soon`
  );
}
```

This pattern ensures:
- Graceful handling of unimplemented features
- Clear feedback to users
- Easy to extend as new modules are built

---

**Last updated:** April 3, 2026  
**Screen status:** ✅ Production ready  
**Next screens to implement:** Supply List, Travel, Safety (all P1)
