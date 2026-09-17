# Item Library Sidebar Menu Redesign Agent

## Expertise

Specialized in React Native menu/drawer UI design with focus on:

- **Responsive drawer patterns** — Handling multiple width states (64px vs 200px)
- **Button constraint management** — Keeping elements within bounds without overflow
- **Icon-based UI patterns** — Replacing text with directional indicators
- **Drawer state design** — Clear visual feedback for open/closed states
- **Accessibility in compact spaces** — 44px hit areas in tight constraints
- **Z-index & layering** — Preventing UI overlap with canvas content

## Scope

Redesign the Item Library Sidebar's collapse/expand button and overall menu structure to:
- Eliminate button overflow/overlay issues
- Fit collapse button perfectly within drawer frame (both 64px and 200px states)
- Provide clear visual indication of drawer state
- Maintain accessibility and usability

## Primary Task

Replace the text-based collapse button with an **icon-only toggle** using directional chevrons:
- **Expanded state (200px):** Show ChevronLeft icon (collapse direction)
- **Collapsed state (64px):** Show ChevronRight icon (expand direction)

This solution:
1. Eliminates text wrapping issues
2. Fits naturally in narrow 64px drawer
3. Provides clear state indication
4. Stays perfectly within drawer bounds

## What Went Wrong Previously

Previous attempts to fix the collapse button through styling tweaks (padding removal, margin reduction) failed because the **fundamental issue is text-based design in a narrow space**. Text "Open"/"Hide" cannot center in 64px without overflow.

**Root cause:** Button trying to fit text in ~56px usable space (64px drawer - 4px padding on each side)

**Solution:** Don't fit text — use icon instead

## Strategy

1. **Import chevron icons** — Already available via lucide-react-native
2. **Replace text with icon** — Single icon, size 20px
3. **Update button styling**
   - Remove `alignSelf: 'center'` (causes centering issues)
   - Use `alignSelf: 'stretch'` (fill drawer width naturally)
   - Icon positioned in center of button
   - Height: 36-40px
   - No padding on button itself
4. **Update accessibility labels** — Icon indicates direction, not text
5. **Test both states** — Collapsed button fits in 64px, expanded shows icon clearly

## Implementation Notes

### Button Rendering
```tsx
// Pseudo-code:
const iconName = collapsed ? ChevronRight : ChevronLeft;

<TouchableOpacity 
  style={styles.collapseButton}
  onPress={onToggleCollapsed}
>
  <Icon {...iconName} size={20} color={colors.text.mid} />
</TouchableOpacity>
```

### Styling Strategy
- **collapseButton:** `alignSelf: 'stretch'`, centered icon, fixed height
- **Removed:** collapseButtonText (no text styling needed)
- **New:** Icon sizing/color control (optional separate style)
- **Container padding:** Only on container, not button

### Files to Modify
- `components/CampGrid/ItemLibrarySidebar.tsx`
  - Replace TouchableOpacity contents
  - Update styles (remove text styles, adjust button)
  - Update accessibility labels

## Success Criteria

✅ Button icon visible in both states (collapsed/expanded)  
✅ Icon clearly indicates expand or collapse direction  
✅ Button stays 100% within drawer frame (no overflow)  
✅ Button fits in 64px drawer without issues  
✅ Button has proper 44px hit area  
✅ No grid overlay or z-index conflicts  
✅ Drawer toggle works smoothly  
✅ TypeScript: 0 errors  
✅ Accessibility: Clear labels for icon intent

## Icon Direction Mapping

**Recommended:**
- `ChevronLeft` when expanded (click to collapse/hide to the left)
- `ChevronRight` when collapsed (click to expand/show to the right)

**Alternative (if more clarity needed):**
- `ChevronsLeft` (double chevron) when expanded
- `ChevronsRight` (double chevron) when collapsed

## Context Files

- **Handoff:** [item-library-sidebar-menu-redesign-handoff.md](item-library-sidebar-menu-redesign-handoff.md)
- **Previous Attempts:** Text-based button styling adjustments (failed)
- **Current Issue:** Button text overflows 64px drawer space

## Deliverable

Implement icon-only toggle button that fits perfectly in drawer, provides clear state indication, and eliminates text overflow issues. Validate with TypeScript and test on device simulator.
