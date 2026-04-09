# Camp Grid UI Optimization Handoff

**Status:** Ready for redesign iteration  
**Date Created:** April 9, 2026  
**Previous Attempt:** Failed (layout overlays caused visual regression)

## Objective

Maximize the visible grid canvas area while maintaining all controls visible and functional.

### User Requirements (from session)

1. **Reduce top bar width by ~40%** — Make the metadata info chip smaller to reclaim horizontal space
2. **Fill reclaimed space** — Grid cells should scale larger to use the freed-up area
3. **Redesign collapse button** — Remove boxed styling, fix text wrapping (currently multi-line in 64px drawer)
4. **Move rotate/delete controls** — Relocate from right side to left side (opposite of settings)
5. **Simplify library items** — Remove per-item rotate buttons (redundant since rotate available in top bar)

---

## Current Architecture

### Layout Structure
```
┌─────────────────────────────────────────┐
│ [Info Chip]     [Rotate] [Delete] [⚙]  │  ← HUD overlay (pointerEvents: box-none)
├─────────────────────────────────────────┤
│                                         │
│        GRID CANVAS (scrollable)        │  ← Main interactive area
│        (flex: 1, minHeight: 0)        │
│                                         │
├─────────────────────────────────────────┤
│ [open/hide button] [Item Library]       │  ← Drawer overlay (optional)
└─────────────────────────────────────────┘
```

### Key Files

- **components/CampGrid/CampGridScene.tsx** — Grid visualization & HUD controls
  - `infoChip` (top-left): Displays grid dimensions
  - `topBarActions` (top-right): Rotate, Delete, Settings buttons
  - `gridLayer`: Renders cells and item cards
  - `settingsOverlay`: Optional grid settings panel

- **components/CampGrid/ItemLibrarySidebar.tsx** — Collapsible item library drawer
  - `collapseButton`: "Open" / "Hide" toggle (currently has box styling, text wraps)
  - `LibraryItemRow`: Renders each library item with rotate button beside it
  - Per-item rotation state managed locally with `useState`

- **app/trips/[id]/camp-grid.tsx** — Screen controller
  - Manages `sidebarCollapsed` state
  - Passes callbacks to both Scene and Sidebar

### Current Styling Issues

1. **Info chip too wide** (maxWidth: '55%') — Takes up too much horizontal space
2. **Collapse button overstyles** — Has background, border, large padding → doesn't fit 64px drawer
3. **Duplicate rotate buttons** — One in library item row, one in top bar → redundant and increases visual clutter
4. **Top bar buttons on right** — Rotate/Delete could be positioned on left for better visual balance

---

## What Went Wrong in Previous Attempt

**Attempted Approach:**
- Moved rotate/delete to `leftActions` on the left side ✓
- Repositioned infoChip to center with `left: 110, right: 60`
- Reduced max-width of infoChip

**Problems:**
- Info chip overlay **covered the grid canvas** → obscured the visualization
- Rotate/Delete buttons positioned **on top of grid area** → not visible when grid is busy
- Left positioning of rotate/delete caused **z-index/stacking conflicts**
- Overall UX regressed: controls not visible, grid coverage increased

---

## Recommended Approach for Next Attempt

### 1. **Keep Current Horizontal Layout**
- Don't move rotate/delete left (the info chip covering grid is the problem)
- Keep right-side action buttons where they are visible

### 2. **Compress Info Chip Vertically Instead**
- Reduce padding (currently `paddingHorizontal: md, paddingVertical: sm`)
- Make text smaller or single-line
- Remove "Cell Xft • Unit Y" subtext or condense it
- This avoids overlay coverage issues

### 3. **Redesign Collapse Button**
- Remove `backgroundColor`, `borderRadius`, `paddingHorizontal: md`
- Use minimal styling: just text with `color: colors.text.mid`
- Wrap text only when necessary; avoid multi-line in narrow drawer
- Option: Use icon + no text, or centered single-letter indicator

### 4. **Expand Grid Canvas**
- Grid cells will auto-scale based on available `canvasSize` (via `cellPx` calculation)
- Currently: `cellPx = Math.max(10, Math.min(canvasSize.width / cols, canvasSize.height / rows))`
- Reducing overhead (padding, info chip height) → larger `canvasSize` → larger cells

### 5. **Optional: Remove Per-Item Rotate Buttons**
- Keep rotation state global or per-library
- Show "(90°)" badge on item label instead of separate button
- Reduces library width, cleaner UI
- Middle-priority item; can be deferred

---

## Testing Checklist

- [ ] Grid cells visibly larger than before
- [ ] Info chip still readable and not covering grid
- [ ] Rotate/Delete buttons visible and clickable
- [ ] Collapse button visible in 64px drawer without text wrapping
- [ ] All HUD controls align properly without z-index conflicts
- [ ] No visual regressions (controls shouldn't overlay grid content)
- [ ] TypeScript compiles with zero errors

---

## Files to Modify

1. **components/CampGrid/CampGridScene.tsx**
   - Reduce infoChip padding
   - Simplify or condense metadata text
   - Keep topBarActions on right side

2. **components/CampGrid/ItemLibrarySidebar.tsx**
   - Simplify collapseButton styling
   - Optional: Remove per-item rotate buttons and styles

3. **app/trips/[id]/camp-grid.tsx**
   - No changes needed (layout structure is fine)

---

## Agent Handoff Notes

**Key Insight:** The problem wasn't the button positions—it was overlay coverage. The previous attempt tried to move elements left, which created z-index conflicts and covered the grid. 

**Better Strategy:** Minimize overhead (info chip size, padding, button styling) to expand canvas naturally without repositioning controls.

**Success Metrics:**
- Cells are visibly ~20-30% larger than current
- All controls remain visible and accessible
- No covering/obscuring of grid content by HUD elements
