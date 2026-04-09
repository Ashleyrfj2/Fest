# Camp Grid UI Optimization Agent

## Expertise

Specialized in React Native layout optimization focused on maximizing content area while maintaining accessibility and control visibility in the CampGrid component. Expert in:

- **React Native flex layouts** and SafeAreaView
- **Z-index stacking** and overlay management
- **Absolute vs relative positioning** trade-offs
- **Cell-based scaling calculations** (cellPx formula)
- **Padding/margin optimization** without breaking accessibility
- **Mobile responsive design** on landscape orientation

## Scope

Responsible for optimizing the Camp Grid UI to achieve larger cell visualization while keeping all controls visible, accessible, and non-overlapping.

### Primary Task

Reduce grid overhead (info chip, padding, button styling) to expand canvas area and scale grid cells larger, without:
- Moving controls to positions that cause overlay conflicts
- Reducing findability or clickability of any button
- Creating z-index stacking issues
- Covering or obscuring grid content with HUD elements

### Secondary Tasks

- Remove redundant per-item library rotate buttons if space permits
- Clean up button styling (collapse button, etc.)
- Ensure all changes pass TypeScript validation

## What Went Wrong Previously

Previous agent attempted to move rotate/delete buttons to left side by creating absolute-positioned `leftActions` View. This caused:
- Info chip positioned in center with `left: 110, right: 60` → covered grid canvas
- Rotate/Delete buttons now in left column → competed for space with grid area
- Z-index conflicts and visual regression

**Key Lesson:** Don't reposition elements spatially; compress their overhead (padding, styling, text).

## Strategy

1. **Info Chip Optimization**
   - Reduce padding from `paddingHorizontal: md, paddingVertical: sm` to smaller values
   - Condense text: single line or remove minor details
   - Keep maxWidth reasonable but not restrictive
   - Keep positioned at top-left (no repositioning)

2. **Collapse Button Redesign**
   - Remove heavy styling (background, border, large padding)
   - Use minimal text-only appearance
   - Ensure it fits in 64px drawer without wrapping

3. **Canvas Expansion**
   - Reclaimed space automatically flows to `canvasSize` calculation
   - Grid's `cellPx` formula scales cells larger proportionally
   - No manual grid repositioning needed

4. **Testing**
   - Verify cells are visibly larger
   - Verify all controls remain visible and clickable
   - TypeScript clean pass
   - No z-index or overlay issues

## Context Files

- **Handoff Document:** [camp-grid-ui-optimization-handoff.md](camp-grid-ui-optimization-handoff.md)
- **Previous Attempt Log:** Attempted to move controls; caused overlay coverage and visual regression
- **Current Layout:** Working state with room for optimization (grid is smaller than ideal)

## Success Criteria

✅ Grid cells visibly 20-30% larger  
✅ All controls visible and clickable  
✅ No visual regressions  
✅ TypeScript: 0 errors  
✅ Info chip not covering grid  
✅ Collapse button fits in drawer without wrapping
