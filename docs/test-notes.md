# Test Notes

Use this file to capture things you want to add, adjust, or fix while testing the app.

## Outstanding Issues

### Lineup
- Lineup component has weird symbol tabs on top that are clickable, the plus sign does not work so unable to add artists.

### Safe-Area Audit (Todo - April 7, 2026)
- [ ] Check ALL screens for scrolling overlap into notification/camera lens top bar
- [ ] Verify SafeAreaView wrapper pattern is consistently applied
- [ ] Test on device with different notch sizes (iPhone 12, 14, 15 variations)
- Travel screen fixed April 7; need to audit other module screens

### Future Enhancements
- I want to be able to import line ups as they drop so all users have easy access to them.

## Completed Fixes (April 7, 2026)
- ✅ Top bar overlap: SafeAreaView wrapper applied to Travel screen (safe-area-context)
- ✅ Vehicle/flight modals: Modal container height changed from `maxHeight` to explicit `height` so form inputs display
- ✅ SafeAreaView deprecation warning: Implemented using react-native-safe-area-context v5.6.2

## Follow-Up (Deferred to Future Work)
- Why is outfit voting in travel plans? → Moved to separate module
- Travel plans map zoom/pan gestures? → Supported by react-native-maps (touch gestures enabled)
- Multiple pin drops with labels: Implemented single trip-level pin with rich metadata (label, notes, type, creator) via bottom-sheet editor. Multi-pin array design deferred.
- Gas calculator: Out of scope; consider for future feature set
- Unique usernames for contact lookup: Out of scope; deferred to future work