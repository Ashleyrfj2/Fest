import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CellSizeValue, MeasurementUnit } from '@/lib/campGridTypes';
import { FestivalDimensionOption, getFestivalPresetByName } from '@/lib/festivalPresets';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

interface DimensionModalProps {
  visible: boolean;
  festivalName: string;
  onSave: (payload: {
    widthFt: number;
    heightFt: number;
    cellSizeFt: CellSizeValue;
    measurementUnit: MeasurementUnit;
    festivalPreset: string;
  }) => void;
}

export function DimensionModal({ visible, festivalName, onSave }: DimensionModalProps) {
  const matchedPreset = useMemo(() => getFestivalPresetByName(festivalName), [festivalName]);
  const options: FestivalDimensionOption[] = matchedPreset?.options ?? [
    { id: 'manual', label: 'Manual Dimensions', widthFt: 20, heightFt: 20 },
  ];

  const [selectedId, setSelectedId] = useState(options[0]?.id ?? 'manual');
  const [widthText, setWidthText] = useState(String(options[0]?.widthFt ?? 20));
  const [heightText, setHeightText] = useState(String(options[0]?.heightFt ?? 20));
  const [cellSizeFt, setCellSizeFt] = useState<CellSizeValue>(1);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('ft');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedOption = options.find((option) => option.id === selectedId) ?? options[0];

  function handlePresetSelect(option: FestivalDimensionOption) {
    setSelectedId(option.id);
    setWidthText(String(option.widthFt));
    setHeightText(String(option.heightFt));
    setValidationError(null);
  }

  function handleSave() {
    const widthFt = Number(widthText);
    const heightFt = Number(heightText);
    if (!Number.isFinite(widthFt) || !Number.isFinite(heightFt) || widthFt <= 0 || heightFt <= 0) {
      setValidationError('Enter valid width and height values greater than 0.');
      return;
    }

    setValidationError(null);

    onSave({
      widthFt,
      heightFt,
      cellSizeFt,
      measurementUnit,
      festivalPreset: selectedOption?.id ?? 'manual',
    });
  }

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Camp Dimensions</Text>
        <Text style={styles.subtitle}>{festivalName || 'Custom Festival'}</Text>

        <View style={styles.section}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, selectedId === option.id && styles.optionActive]}
              onPress={() => handlePresetSelect(option)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Width (ft)</Text>
            <TextInput
              value={widthText}
              onChangeText={(value) => {
                setWidthText(value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Height (ft)</Text>
            <TextInput
              value={heightText}
              onChangeText={(value) => {
                setHeightText(value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

        <View style={styles.row}>
          {[0.5, 1, 1.5].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.pill, cellSizeFt === size && styles.pillActive]}
              onPress={() => {
                setCellSizeFt(size as CellSizeValue);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Set cell size to ${size} feet`}
            >
              <Text style={[styles.pillText, cellSizeFt === size && styles.pillTextActive]}>{size}ft</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          {(['ft', 'm'] as MeasurementUnit[]).map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.pill, measurementUnit === unit && styles.pillActive]}
              onPress={() => setMeasurementUnit(unit)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${unit} units`}
            >
              <Text style={[styles.pillText, measurementUnit === unit && styles.pillTextActive]}>{unit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save dimensions and start building"
        >
          <Text style={styles.saveButtonText}>Start Building</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  title: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.text.mid,
  },
  section: {
    gap: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  optionActive: {
    borderColor: colors.accent.gold,
    backgroundColor: '#2A2517',
  },
  optionText: {
    color: colors.text.primary,
    fontWeight: typography.weight.label,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.text.mid,
    fontSize: typography.size.meta,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    fontWeight: typography.weight.label,
  },
  input: {
    backgroundColor: colors.surface.level2,
    color: colors.text.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.level2,
  },
  pillActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  pillText: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  pillTextActive: {
    color: colors.base,
  },
  saveButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
  },
  saveButtonText: {
    color: colors.base,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
  },
});
