import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CellSizeValue, MeasurementUnit } from '@/lib/campGridTypes';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

interface GridSettingsPanelProps {
  cellSizeFt: CellSizeValue;
  measurementUnit: MeasurementUnit;
  onCellSizeChange: (size: CellSizeValue) => void;
  onMeasurementUnitChange: (unit: MeasurementUnit) => void;
}

export function GridSettingsPanel({
  cellSizeFt,
  measurementUnit,
  onCellSizeChange,
  onMeasurementUnitChange,
}: GridSettingsPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>Grid Cell Size</Text>
      <View style={styles.row}>
        {[0.5, 1, 1.5].map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.pill, cellSizeFt === size && styles.pillActive]}
            onPress={() => onCellSizeChange(size as CellSizeValue)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, cellSizeFt === size && styles.pillTextActive]}>{size}ft</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, styles.labelSpacing]}>Measurements</Text>
      <View style={styles.row}>
        {(['ft', 'm'] as MeasurementUnit[]).map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[styles.pill, measurementUnit === unit && styles.pillActive]}
            onPress={() => onMeasurementUnitChange(unit)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, measurementUnit === unit && styles.pillTextActive]}>{unit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  labelSpacing: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pillActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  pillText: {
    fontSize: typography.size.body,
    color: colors.text.primary,
    fontWeight: typography.weight.label,
  },
  pillTextActive: {
    color: colors.base,
  },
});
