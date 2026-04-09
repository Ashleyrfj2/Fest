import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, PanResponder } from 'react-native';
import { Plus, RotateCw } from 'lucide-react-native';
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAddItem: (template: CampItemTemplate) => void | Promise<void>;
  onDragStart: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragMove: (point: { x: number; y: number }) => void;
  onDragEnd: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragCancel: () => void;
  onCreateCustomItem: () => void;
}

interface LibraryItemRowProps {
  item: CampItemTemplate;
  rotated: boolean;
  onToggleRotation: () => void;
  onAddItem: (template: CampItemTemplate) => void | Promise<void>;
  onDragStart: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragMove: (point: { x: number; y: number }) => void;
  onDragEnd: (template: CampItemTemplate, point: { x: number; y: number }) => void;
  onDragCancel: () => void;
}

function applyRotation(template: CampItemTemplate, rotated: boolean): CampItemTemplate {
  if (!rotated) {
    return template;
  }

  return {
    ...template,
    widthFt: template.heightFt,
    heightFt: template.widthFt,
  };
}

function LibraryItemRow({
  item,
  rotated,
  onToggleRotation,
  onAddItem,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: LibraryItemRowProps) {
  const dragStartedRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const preparedItem = applyRotation(item, rotated);

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
        accessibilityHint="Tap to add to grid, or drag and drop onto the grid"
      >
        <View style={[styles.swatch, { backgroundColor: preparedItem.color }]} />
        <View style={styles.textContainer}>
          <Text style={styles.itemLabel}>{preparedItem.label}</Text>
          <Text style={styles.itemMeta}>
            {preparedItem.widthFt} x {preparedItem.heightFt} ft
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.rotateButton}
        onPress={onToggleRotation}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Rotate ${preparedItem.label}`}
      >
        <RotateCw size={16} color={rotated ? colors.base : colors.text.mid} strokeWidth={2} />
        <Text style={[styles.rotateButtonText, rotated && styles.rotateButtonTextActive]}>{rotated ? '90°' : '0°'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ItemLibrarySidebar({
  collapsed,
  onToggleCollapsed,
  onAddItem,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onCreateCustomItem,
}: ItemLibrarySidebarProps) {
  const [rotations, setRotations] = useState<Record<string, boolean>>({});

  return (
    <View style={[styles.container, collapsed && styles.containerCollapsed]}>
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={onToggleCollapsed}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Open item library' : 'Collapse item library'}
      >
        <Text style={styles.collapseButtonText}>{collapsed ? 'Open' : 'Hide'}</Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text style={styles.title}>Item Library</Text>
          <Text style={styles.helperText}>Tap to add or drag onto the grid. Rotate items before you place them.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {ITEM_LIBRARY.map((item) => (
              <LibraryItemRow
                key={item.itemType}
                item={item}
                rotated={Boolean(rotations[item.itemType])}
                onToggleRotation={() =>
                  setRotations((current) => ({
                    ...current,
                    [item.itemType]: !current[item.itemType],
                  }))
                }
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: colors.surface.level1,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.subtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  containerCollapsed: {
    width: 72,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  collapseButtonText: {
    color: colors.text.mid,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  helperText: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
    lineHeight: 18,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'stretch',
  },
  itemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 44,
  },
  rotateButton: {
    width: 54,
    minHeight: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  rotateButtonText: {
    color: colors.text.mid,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
  },
  rotateButtonTextActive: {
    color: colors.base,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
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
