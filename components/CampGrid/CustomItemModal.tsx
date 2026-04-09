import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RotateCw } from 'lucide-react-native';
import { CampItemTemplate } from '@/lib/campGridTypes';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

const COLOR_OPTIONS = ['#28C896', '#4A9EFF', '#F280B0', '#C9A84C', '#6D30CC', '#FF6B6B', '#FFB84D', '#7ED957'];

interface CustomItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (template: CampItemTemplate) => void | Promise<void>;
}

export function CustomItemModal({ visible, onClose, onSave }: CustomItemModalProps) {
  const [label, setLabel] = useState('Custom Item');
  const [widthText, setWidthText] = useState('6');
  const [heightText, setHeightText] = useState('4');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [rotated, setRotated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    setLabel('Custom Item');
    setWidthText('6');
    setHeightText('4');
    setColor(COLOR_OPTIONS[0]);
    setRotated(false);
    setValidationError(null);
  }, [visible]);

  if (!visible) {
    return null;
  }

  async function handleSave() {
    const rawWidth = Number(widthText);
    const rawHeight = Number(heightText);

    if (!Number.isFinite(rawWidth) || !Number.isFinite(rawHeight) || rawWidth <= 0 || rawHeight <= 0) {
      setValidationError('Enter valid width and height values greater than 0.');
      return;
    }

    setValidationError(null);

    const template: CampItemTemplate = {
      itemType: 'custom',
      label: label.trim() || 'Custom Item',
      color,
      widthFt: rotated ? rawHeight : rawWidth,
      heightFt: rotated ? rawWidth : rawHeight,
    };

    await onSave(template);
    onClose();
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Custom Item</Text>
        <Text style={styles.subtitle}>Make your own footprint and add it to the camp layout.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Label</Text>
          <TextInput value={label} onChangeText={setLabel} style={styles.input} placeholder="Custom Item" placeholderTextColor={colors.text.dim} />
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

        <TouchableOpacity
          style={[styles.rotateToggle, rotated && styles.rotateToggleActive]}
          onPress={() => setRotated((current) => !current)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Rotate custom item"
        >
          <RotateCw size={16} color={rotated ? colors.base : colors.text.primary} strokeWidth={2} />
          <Text style={[styles.rotateToggleText, rotated && styles.rotateToggleTextActive]}>
            {rotated ? 'Rotated 90°' : 'Default Orientation'}
          </Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: option },
                  color === option && styles.colorSwatchSelected,
                ]}
                onPress={() => setColor(option)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Choose item color ${option}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cancel custom item"
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void handleSave()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Save custom item"
          >
            <Text style={styles.primaryButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 40,
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
  inputGroup: {
    gap: spacing.xs,
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
  rotateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  rotateToggleActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  rotateToggleText: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  rotateToggleTextActive: {
    color: colors.base,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.surface.level2,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  primaryButton: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.accent.gold,
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
  },
  primaryButtonText: {
    color: colors.base,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
});
