import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Contrast, Layers3, MoonStar, SunMedium, Type } from 'lucide-react-native';
import { SettingsCard, SettingsPageFrame, SettingsSectionLabel } from './_components';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

type Choice = 'system' | 'dark' | 'light';
type Density = 'standard' | 'compact';
type TextSize = 'standard' | 'large' | 'xlarge';

function ChoicePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function AppearanceSettingsScreen() {
  const [theme, setTheme] = useState<Choice>('system');
  const [density, setDensity] = useState<Density>('standard');
  const [textSize, setTextSize] = useState<TextSize>('standard');

  return (
    <SettingsPageFrame
      title="Appearance"
      subtitle="Pick how the app should feel. These controls are ready in the UI and can be connected to app-wide theme state next."
    >
      <SettingsCard>
        <SettingsSectionLabel>Theme</SettingsSectionLabel>
        <View style={styles.choiceRow}>
          <ChoicePill label="System" selected={theme === 'system'} onPress={() => setTheme('system')} />
          <ChoicePill label="Dark" selected={theme === 'dark'} onPress={() => setTheme('dark')} />
          <ChoicePill label="Light" selected={theme === 'light'} onPress={() => setTheme('light')} />
        </View>
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Density</SettingsSectionLabel>
        <View style={styles.choiceRow}>
          <ChoicePill label="Standard" selected={density === 'standard'} onPress={() => setDensity('standard')} />
          <ChoicePill label="Compact" selected={density === 'compact'} onPress={() => setDensity('compact')} />
        </View>
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Text Size</SettingsSectionLabel>
        <View style={styles.choiceRow}>
          <ChoicePill label="Standard" selected={textSize === 'standard'} onPress={() => setTextSize('standard')} />
          <ChoicePill label="Large" selected={textSize === 'large'} onPress={() => setTextSize('large')} />
          <ChoicePill label="XL" selected={textSize === 'xlarge'} onPress={() => setTextSize('xlarge')} />
        </View>
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Preview</SettingsSectionLabel>
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <SunMedium size={18} color={colors.base} />
          </View>
          <View style={styles.previewBody}>
            <Text style={styles.previewTitle}>Theme: {theme}</Text>
            <Text style={styles.previewSubtitle}>Density: {density} · Text: {textSize}</Text>
          </View>
        </View>
        <Pressable
          style={styles.previewButton}
          onPress={() => Alert.alert('Coming soon', 'Appearance choices will be connected to app-wide theme state.')}
        >
          <Contrast size={16} color={colors.base} />
          <Text style={styles.previewButtonText}>Apply app-wide later</Text>
        </Pressable>
      </SettingsCard>

      <Text style={{ color: colors.text.mid, marginTop: -4 }}>
        This page is the first step toward a full theme system. The controls are local for now.
      </Text>
    </SettingsPageFrame>
  );
}

const styles = StyleSheet.create({
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  pillSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  pillText: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  pillTextSelected: {
    color: colors.base,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    flex: 1,
  },
  previewTitle: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
  },
  previewSubtitle: {
    color: colors.text.mid,
    marginTop: 2,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
  },
  previewButtonText: {
    color: colors.base,
    fontWeight: typography.weight.cardTitle,
  },
});
