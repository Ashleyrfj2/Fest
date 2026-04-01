import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/lib/tokens';

interface GridBackgroundProps {
  widthPx: number;
  heightPx: number;
  cols: number;
  rows: number;
  cellPx: number;
}

export function GridBackground({ widthPx, heightPx, cols, rows, cellPx }: GridBackgroundProps) {
  return (
    <View style={[styles.grid, { width: widthPx, height: heightPx }]}>
      {Array.from({ length: cols + 1 }).map((_, idx) => (
        <View
          key={`v-${idx}`}
          style={[styles.vLine, { left: idx * cellPx, height: heightPx }]}
        />
      ))}
      {Array.from({ length: rows + 1 }).map((_, idx) => (
        <View
          key={`h-${idx}`}
          style={[styles.hLine, { top: idx * cellPx, width: widthPx }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    backgroundColor: colors.surface.level1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
  },
  vLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: colors.border.subtle,
  },
  hLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.border.subtle,
  },
});
