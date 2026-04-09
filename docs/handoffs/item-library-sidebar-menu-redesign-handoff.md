# Item Library Sidebar Menu Redesign Handoff

**Status:** Pending redesign  
**Date Created:** April 9, 2026  
**Issue:** Collapse button overlays/hangs outside drawer frame despite styling adjustments

## Problem Analysis

### Current Issue
- Collapse button (text "Open"/"Hide") still overlays the grid and extends outside the drawer frame
- Previous fix (removing padding, reducing margins) did not fully resolve the problem
- Button appears to be competing for space or positioned incorrectly within the drawer

### Root Causes (Likely)
1. **Button positioning:** Currently `alignSelf: 'center'` — centers within full 200px width, but when collapsed to 64px, text cannot fit centered
2. **Text overflow:** "Open" / "Hide" text has inherent width; centering in 64px space causes overflow
3. **No explicit bounds:** Button not constrained to drawer width; overflows outside container
4. **Drawer padding:** `paddingHorizontal: spacing.xs` (4px) on collapsed container leaves only ~56px usable space
5. **Interaction model unclear:** Visual hierarchy suggests button is a primary control, not a subtle toggle

### Symptoms
- User sees button hanging over grid edge
- Button appears to be in wrong location
- Visual confusion: is this part of sidebar or overlay on grid?
- No clear visual feedback about drawer state

---

## Current Architecture

### Drawer Structure (Collapsed State)
```
┌─────────────────────────┐ width: 64px
│ [Open button - TEXT]    │ ← Centered, overflows
│                         │
│ (hidden content)        │
└─────────────────────────┘
```

### Issues with Current Design
- **Text button in narrow space:** 64px drawer can't center multi-character text comfortably
- **No visual indicator:** Users can't tell if drawer is open/closed without reading text
- **Positioning conflict:** Button fights with drawer boundary
- **Inconsistent UX:** Expanded drawer uses text ("Open"/"Hide"), collapsed drawer tries same

---

## Design Requirements

### What the Button Must Do
1. **Toggle drawer state** — Expand/collapse sidebar
2. **Be always visible** — Both expanded and collapsed
3. **Never overlap grid** — Stay strictly within drawer bounds
4. **Fit in 64px width** — Compressed state must be compact
5. **Indicate state** — User should see open/closed status
6. **Accessible** — Button must be tappable, with enough hit area (44px min)

### Design Constraints
- Drawer compressed width: 64px (minus padding = ~56px usable)
- Drawer expanded width: 200px
- Button accessibility: 44px minimum height recommended
- No overlays onto grid canvas

---

## Recommended Solutions

### Option A: Icon-Only Toggle (Recommended)
**Approach:** Replace text with icon; use chevron/arrow/chevron-double

```
Expanded: [⟨] "Hide" + library items
            ↓ (full width, text + icon)

Collapsed: [≫]
           ↓ (small icon centered, fits in 64px)
```

**Pros:**
- Icon fits comfortably in 64px
- Clear state indication (direction of arrow)
- No text wrapping issues
- Consistent across states

**Cons:**
- Need to choose right icon
- Less explicit than text

### Option B: Reposition As Sidebar Header
**Approach:** Button becomes first item in list, within drawer boundaries

```
Expanded:
┌────────────────────┐
│ [Hide] Item Lib ◁  │ ← As header, part of scrollable content
├────────────────────┤
│ ● Tent 8x8 ft      │
│ ● Canopy 10x10 ft  │
└────────────────────┘

Collapsed:
┌──────┐
│  ◁   │ ← Icon only, no room for list
└──────┘
```

**Pros:**
- Button stays within drawer frame by definition
- Natural part of sidebar, not separate control
- Scrolls with content if needed

**Cons:**
- Harder to access when expanded (buried in list)
- More complex structure

### Option C: Minimize Button Further
**Approach:** Ultra-compact button with rotation-aware design

```
Collapsed: [ ⟨ ]  (28px height, icon only, centered)
Expanded: [Hide ⟩] (full width, icon on right)
```

**Pros:**
- Keeps simple text-based approach
- Icon adds state clarity
- Consistent with current structure

**Cons:**
- Still requires state-based styling
- Icon size management tricky

---

## Recommended Implementation Strategy

### Primary Approach: Icon-Only Toggle (Option A)
1. **Replace text with icon** — Use directional chevron/arrow
   - Expanded state: `ChevronLeft` icon (indicates "collapse left")
   - Collapsed state: `ChevronRight` icon (indicates "expand right")

2. **Simplify button styling** — No text, just icon
   - Width: 100% of drawer width
   - Height: 36-40px
   - Padding: minimal
   - Icon size: 20px

3. **Ensure button stays in frame** — Explicit bounds
   - Set `alignSelf: 'stretch'` instead of `center`
   - No horizontal padding on button itself
   - Container manages drawer padding only

4. **Add visual feedback** — Icon rotation or color change
   - Optional: slight background highlight on toggle
   - Color change: `colors.text.dim` → `colors.base` when hovered

---

## Testing Checklist

- [ ] Button visibly stays inside drawer frame (no overflow)
- [ ] Button fits in both 64px (collapsed) and 200px (expanded) states
- [ ] Icon clearly indicates expand/collapse direction
- [ ] Button has 44px minimum hit area (tappable)
- [ ] No grid overlay or z-index conflicts
- [ ] Drawer opens/closes on button tap
- [ ] TypeScript compiles with zero errors
- [ ] Accessibility labels updated for icon-only design

---

## Files to Modify

1. **components/CampGrid/ItemLibrarySidebar.tsx**
   - Replace text button with icon button
   - Update collapseButton styling for icon
   - Remove collapseButtonText styling
   - Add icon size/color styling
   - Update accessibility labels

2. **lib/tokens.ts** or icon library
   - Ensure ChevronLeft/ChevronRight icons available
   - (Already has lucide-react-native imports)

---

## Key Decision Point

**Choose icon direction mapping:**
- **Chevron Left** = "Click to collapse left" (points toward hidden area)
- **Chevron Right** = "Click to expand right" (points toward content)

OR

- **Double Chevron Left** = "Hide"
- **Double Chevron Right** = "Show"

Recommend: Single chevron, contextual direction (easier to understand)

---

## Success Criteria

✅ Button visible in both drawer states  
✅ Never overlaps grid  
✅ Fits within 64px drawer width  
✅ Clear expand/collapse indication  
✅ Accessible (44px hit area)  
✅ No text wrapping or overflow  
✅ TypeScript: 0 errors
