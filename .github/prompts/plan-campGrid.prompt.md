# Camp Grid Implementation Plan — MVP Phase

## Overview
Build a drag-and-drop campsite layout tool for FestNest. **Phase 1 (this plan):** Local-only grid editing with SQLite persistence. **Phase 2 (future):** Supabase sync + team collaboration.

---

## Phase 1 Deliverables

### 1. Festival Preset Definitions
**File**: `lib/festivalPresets.ts`
- Predefined campgrounds per festival
- Each with ticket tiers (GA, VIP, Good Life) → dimensions
- Example:
  ```typescript
  Electric Forest: {
    GA: { width: 20, height: 20, label: "GA (No Car)" },
    GoodLife: { width: 30, height: 25 },
    VIP: { width: 50, height: 50 },
    manual: true // allow custom input
  }
  ```

### 2. SQLite Schema (Local Storage)
**File**: `lib/sqlite/migrations/camp-grid.sql`
- Tables:
  - `camp_grid_local`: trip_id, width_ft, height_ft, cell_size_ft, festival_preset
  - `camp_item_local`: id, grid_id, item_type, x, y, width_cells, height_cells, label, color, assigned_to_name

### 3. SQLite Database Hook
**File**: `lib/sqlite/useCampGridDB.ts`
- Initialize SQLite on first grid screen open
- CRUD functions: createItem, moveItem, deleteItem, getItems, saveGrid, loadGrid
- Returns `{ grid, items, isLoading, errors }`

### 4. Grid Screen (Main)
**File**: `app/trips/[id]/camp-grid.tsx`
- Entry point; handles orientation lock to landscape
- Delegates to CampGridScene component (PanResponder/React Native Animated)

### 5. Camp Grid Scene Component
**File**: `components/CampGrid/CampGridScene.tsx`
- Renders grid background (1ft cells)
- Renders placed items as draggable boxes
- Responds to pan gestures (drag, drop, snap to grid)
- Shows item label + color on each item
- Visual feedback: shadow on active item, snap preview

### 6. Item Library Sidebar
**File**: `components/CampGrid/ItemLibrarySidebar.tsx`
- Collapsible sidebar (right side)
- Scrollable list of item types (Tent, Car, Table, etc.)
- Tap item type → adds new item to grid at center
- Shows picker to remove item

### 7. Dimension Setup Flow
**File**: `components/CampGrid/DimensionModal.tsx`
- Triggered on first visit or via "Edit Layout" button
- Step 1: Festival selector (dropdown or List)
- Step 2: Ticket type selector (GA, VIP, Good Life, etc.)
- Step 3: Display dimensions, confirm or override manually
- Saves to SQLite on confirm

### 8. Storage Sync Layer
**File**: `lib/sqlite/campGridSync.ts`
- When user navigates away: serialize grid → SQLite
- When reopening camp grid screen: deserialize from SQLite
- On app reconnect: detect changes locally, prepare for Supabase sync (Phase 2)

---

## UI/UX Flow

### First Time on Camp Grid
1. Land on camp grid → DimensionModal appears
2. Select Festival (Electric Forest)
3. Select Ticket (GA)
4. See 20×20 grid auto-rendered
5. ItemLibrarySidebar visible on right
6. Tap "Add Tent" → tent appears in center of grid
7. Drag to position, snaps to 1ft grid
8. Tap item to select; trash icon to delete
9. Nav away → auto-save to SQLite

### Returning to Camp Grid
1. Load from SQLite
2. All previous items + grid size displayed
3. Continue editing

---

## Technical Approach

### Grid Rendering
- Canvas or React Native View-based grid cells (start with View for simplicity)
- Each cell = 1ft
- Display dimensions → iPhone width at 375px
- Scaling: `cellPixelWidth = screenWidth / (totalWidth_ft / cell_size_ft)`
- Example: 20ft width on 300px screen = 15px per ft

### Drag & Drop
- Use React Native `PanResponder` for touch handling
- On pan move: update item x/y in real-time
- On pan end: snap to nearest 1ft cell
- Collision detection: warn via visual highlight (skip hard collision for v1)

### Item Library
- Array of item type definitions:
  ```typescript
  {
    type: 'tent',
    label: '2-Person Tent',
    width_ft: 8,
    height_ft: 8,
    color: '#C9A84C',
    icon: TentIcon
  }
  ```

### SQLite Setup
- Use `expo-sqlite` (native SQLite available in Expo)
- Create pool on app init
- Lazy-load migrations on first camp-grid screen access

---

## File Structure
```
app/
├── trips/
│   └── [id]/
│       └── camp-grid.tsx          # Main entry, orientation lock

components/
├── CampGrid/
│   ├── CampGridScene.tsx          # Pan/drag/render grid + items
│   ├── ItemLibrarySidebar.tsx     # Collapsible item picker
│   ├── DimensionModal.tsx         # Festival → ticket → confirm dims
│   ├── ItemCard.tsx               # Single draggable item on grid
│   └── GridBackground.tsx         # Rendered grid cells

lib/
├── festivalPresets.ts             # Hardcoded festivals + tiers
├── sqlite/
│   ├── db.ts                      # SQLite pool init + schema
│   ├── migrations/
│   │   └── camp-grid.sql
│   ├── useCampGridDB.ts           # Hook: CRUD + query
│   └── campGridSync.ts            # Serialize/deserialize
└── campGridTypes.ts               # TypeScript types
```

---

## Implementation Order

### Stage 1: Setup Infrastructure
1. Create festivalPresets.ts
2. Create SQLite db.ts + migration file
3. Set up expo-sqlite + type definitions

### Stage 2: UI Shells
4. Create CampGridScene (empty)
5. Create ItemLibrarySidebar (empty)
6. Create DimensionModal (empty)
7. Create camp-grid.tsx route

### Stage 3: Core Grid Logic
8. Implement useCampGridDB hook (CRUD)
9. Implement grid rendering in CampGridScene
10. Implement PanResponder for drag/drop
11. Implement grid snapping logic

### Stage 4: UI Polish
12. ItemCard component (draggable item visuals)
13. ItemLibrarySidebar interaction (add/remove)
14. DimensionModal flow (festival → ticket → confirm)
15. Orientation lock + responsive sizing

### Stage 5: Integration
16. Wire DimensionModal to first visit
17. Wire ItemLibrarySidebar to add items
18. Wire drag to move items, update SQLite
19. Test full flow end-to-end

---

## Considerations & Constraints

### Landscape Lock
- Use `expo-screen-orientation` to lock camp grid to landscape
- Show warning if user rotates

### Performance
- Start with View-based, consider canvas if 100+ items
- Memoize grid cells, use FlatList for item library

### Offline-First
- SQLite is the source of truth for v1
- No Supabase writes yet
- Mark items as "unsync'd" for Phase 2

### Collision Detection
- For MVP v1: visual highlight only (no hard prevention)
- Phase 2: implement warning + prevention if needed

### Future Phases
- Phase 2: Real-time Supabase sync + permissions
- Phase 3: Export to PNG, sharing, annotations
- Phase 4: Rotation, resizing, advanced item library

---

## Verification Steps (End-to-End)

1. Open app → create trip → navigate to camp grid screen
2. Land on empty grid → DimensionModal appears
3. Select Electric Forest → GA → confirm 20×20 grid
4. Grid renders with 1ft cells
5. Tap "Add Tent" → 8×8 tent appears at center
6. Drag tent → moves smoothly, snaps to 1ft grid on release
7. Add car → 10×6 item placed
8. Delete tent via trash icon
9. Navigate away → toast "Saved to device"
10. Return to camp grid → items restored from SQLite
11. Landscape rotation works smoothly; portrait shows orientation warning

---

## Open Questions / Refinements

- **Collision behavior**: Warn on overlap, or silently allow stacking?
- **Rotate/resize**: Fixed orientation in v1, or include rotation controls?
- **Custom items**: Locked to preset library, or allow user-defined items?
- **Next priority**: After camp grid, which module? (Food planner, Supply list, Travel, Lineup?)
