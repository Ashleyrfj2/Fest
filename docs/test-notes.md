# Test Notes

Use this file to capture things you want to add, adjust, or fix while testing the app.

## Outstanding Issues

### Safe-Area Audit (✅ COMPLETED - April 7, 2026)
- [x] Check ALL screens for scrolling overlap into notification/camera lens top bar
- [x] Verify SafeAreaView wrapper pattern is consistently applied
- [x] Test on device with different notch sizes (iPhone 12, 14, 15 variations)
- [x] All 9 module screens now have SafeAreaView (Travel & Budget were already done)
- [x] Removed hardcoded `paddingTop: 60` from headers in: Supply List, Packing Checklist, Collaboration, Food Planner
- [x] Camp Grid uses `edges={['left', 'right']}` for landscape mode

### Future Enhancements
- I want to be able to import line ups as they drop so all users have easy access to them.

## Completed Fixes (April 7, 2026)
- ✅ Top bar overlap: SafeAreaView wrapper applied to Travel screen (safe-area-context)
- ✅ Vehicle/flight modals: Modal container height changed from `maxHeight` to explicit `height` so form inputs display
- ✅ Safe-area audit complete: All 9 module screens now wrapped in SafeAreaView:
  - Supply List (edges=['top'])
  - Packing Checklist (edges=['top'])
  - Collaboration (edges=['top'])
  - Safety Profile (edges=['top'])
  - Food Planner (edges=['top'])
  - Lineup (edges=['top'])
  - Camp Grid (edges=['left', 'right'] for landscape)
  - Travel (edges=['top']) — already done
  - Budget (has SafeAreaView) — already done
- ✅ Removed hardcoded `paddingTop: 60` from headers where SafeAreaView applied
- ✅ SafeAreaView deprecation warning: Implemented using react-native-safe-area-context v5.6.2
- ✅ Lineup: Fixed TextInput import (moved to top), replaced emoji filter tabs with proper icons + labels (Must See, Want to See, Skip)

## Follow-Up (Deferred to Future Work)
- Why is outfit voting in travel plans? → Moved to separate module
- Travel plans map zoom/pan gestures? → Supported by react-native-maps (touch gestures enabled)
- Multiple pin drops with labels: Implemented single trip-level pin with rich metadata (label, notes, type, creator) via bottom-sheet editor. Multi-pin array design deferred.
- Gas calculator: Out of scope; consider for future feature set
- Unique usernames for contact lookup: Out of scope; deferred to future work