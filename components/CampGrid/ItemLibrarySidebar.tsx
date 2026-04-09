import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, PanResponder } from 'react-native';
import { Plus } from 'lucide-react-native';
import { CampItemTemplate } from '@/lib/campGridTypes';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

const ITEM_LIBRARY: CampItemTemplate[] = [
  { itemType: 'tent', label: 'Tent', color: '#28C896', widthFt: 8, heightFt: 8 },
  { itemType: 'canopy', label: 'Canopy', color: '#4A9EFF', widthFt: 10, heightFt: 10 },
  { itemType: 'car', label: 'Car', color: '#F280B0', widthFt: 8, heightFt: 14 },
  { itemType: 'table', label: 'Table', color: '#C9A84C', widthFt: 4, heightFt: 2 },
  { itemType: 'cooler', label: 'Cooler', color: '#6D30CC', widthFt: 3, heightFt: 2 },
  { itemType: 'fire_pit', label: 'Fire Pit', color: '#FF6B6B', widthFt: 3, heightFt: 3 },
  { itemType: 'path', label: 'Path', color: '#B47AFF', widthFt: 2, heightFt: 8 },
];

interface ItemLibrarySidebarProps {
  onAddItem: (template: CampItemTemplate) => void | Promise<void>;
  onDragStart: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragMove: (point: { x: number; y: number }) => void;
  onDragEnd: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragCancel: () => void;
  onCreateCustomItem: () => void;
}

interface LibraryItemRowProps {
  item: CampItemTemplate;
  onAddItem: (template: CampItemTemplate) => void | Promise<void>;
  onDragStart: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragMove: (point: { x: number; y: number }) => void;
  onDragEnd: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragCancel: () => void;
}

function LibraryItemRow({
  item,
  onAddItem,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: LibraryItemRowProps) {
  const dragStartedRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const preparedItem = item;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dragStartedRef.current = false;
          startPointRef.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };
        },
        onPanResponderMove: (_, gestureState) => {
          const hasMovedEnough = Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
          if (!dragStartedRef.current && hasMovedEnough) {
            dragStartedRef.current = true;
            onDragStart(preparedItem, startPointRef.current);
          }
          if (dragStartedRef.current) {
            onDragMove({ x: gestureState.moveX, y: gestureState.moveY });
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (dragStartedRef.current) {
            onDragEnd(preparedItem, {
              x: gestureState.moveX || startPointRef.current.x,
              y: gestureState.moveY || startPointRef.current.y,
            });
          } else {
            void onAddItem(preparedItem);
          }
          dragStartedRef.current = false;
        },
        onPanResponderTerminate: () => {
          if (dragStartedRef.current) {
            onDragCancel();
          }
          dragStartedRef.current = false;
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [onAddItem, onDragCancel, onDragEnd, onDragMove, onDragStart, preparedItem]
  );

  return (
    <View style={styles.itemRow}>
      <View
        {...panResponder.panHandlers}
        style={styles.itemButton}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Add ${preparedItem.label}`}
        accessibilityHint="Tap to add this item to the grid"
      >
        <View style={[styles.swatch, { backgroundColor: preparedItem.color }]} />
        <View style={styles.textContainer}>
          <Text style={styles.itemLabel}>{preparedItem.label}</Text>
          <Text style={styles.itemMeta}>
            {preparedItem.widthFt} x {preparedItem.heightFt} ft
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ItemLibrarySidebar({
  onAddItem,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onCreateCustomItem,
}: ItemLibrarySidebarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Library</Text>
      <Text style={styles.helperText}>Tap to add items to the grid.</Text>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {ITEM_LIBRARY.map((item) => (
          <LibraryItemRow
            key={item.itemType}
            item={item}
            onAddItem={onAddItem}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          />
        ))}

        <TouchableOpacity
          style={styles.customButton}
          onPress={onCreateCustomItem}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add custom camp item"
        >
          <View style={styles.customIcon}>
            <Plus size={18} color={colors.base} strokeWidth={2.2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.customTitle}>Create Custom Item</Text>
            <Text style={styles.customMeta}>Choose label, size, color, and rotation</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: 'rgba(21, 18, 32, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.24)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  title: {
    color: colors.accent.goldBright,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    marginBottom: 2,
    alignSelf: 'center',
    width: '85%',
  },
  helperText: {
    color: colors.text.mid,
    fontSize: typography.size.meta,
    lineHeight: 16,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    width: '85%',
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  itemRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemButton: {
    width: '85%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(37, 32, 51, 0.92)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(180, 122, 255, 0.22)',
    minHeight: 44,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  itemMeta: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
  },
  customButton: {
    width: '85%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(18, 120, 90, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(40, 200, 150, 0.3)',
    marginTop: spacing.sm,
    minHeight: 44,
  },
  customIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitle: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  customMeta: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
  },
});
