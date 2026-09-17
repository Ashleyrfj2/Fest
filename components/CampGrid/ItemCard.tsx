import React, { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { CampItem } from '@/lib/campGridTypes';
import { borderRadius, colors, typography } from '@/lib/tokens';

interface ItemCardProps {
  item: CampItem;
  left: number;
  top: number;
  width: number;
  height: number;
  selected: boolean;
  onDrop: (id: string, leftPx: number, topPx: number) => void;
  onSelect: (id: string) => void;
}

export function ItemCard({ item, left, top, width, height, selected, onDrop, onSelect }: ItemCardProps) {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          onSelect(item.id);
        },
        onPanResponderMove: (_, gestureState) => {
          setDx(gestureState.dx);
          setDy(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextLeft = left + gestureState.dx;
          const nextTop = top + gestureState.dy;
          setIsDragging(false);
          setDx(0);
          setDy(0);
          onDrop(item.id, nextLeft, nextTop);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDx(0);
          setDy(0);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [item.id, left, onDrop, onSelect, top]
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.item,
        {
          left: left + dx,
          top: top + dy,
          width,
          height,
          backgroundColor: item.color,
          zIndex: isDragging ? 3 : 1,
        },
        selected && styles.itemSelected,
        isDragging && styles.itemDragging,
      ]}
    >
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(14, 12, 22, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  itemSelected: {
    borderColor: colors.accent.gold,
    borderWidth: 2,
  },
  itemDragging: {
    opacity: 0.92,
  },
  label: {
    color: colors.base,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
  },
});
