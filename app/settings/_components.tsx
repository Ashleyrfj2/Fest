import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

type SettingsPageFrameProps = {
  title: string;
  subtitle: string;
  showBack?: boolean;
  children: ReactNode;
};

export function SettingsPageFrame({
  title,
  subtitle,
  showBack = true,
  children,
}: SettingsPageFrameProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={colors.text.mid} />
          </Pressable>
        ) : null}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {children}
      </ScrollView>
    </View>
  );
}

type SettingsCardProps = {
  children: ReactNode;
};

export function SettingsCard({ children }: SettingsCardProps) {
  return <View style={styles.card}>{children}</View>;
}

type SettingsSectionLabelProps = {
  children: ReactNode;
};

export function SettingsSectionLabel({ children }: SettingsSectionLabelProps) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

type SettingsRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  destructive = false,
}: SettingsRowProps) {
  const RowContainer = onPress ? Pressable : View;

  return (
    <RowContainer
      {...(onPress
        ? {
            onPress,
            style: ({ pressed }: { pressed: boolean }) => [styles.row, pressed && styles.rowPressed],
          }
        : { style: styles.row })}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, destructive && styles.destructiveText]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={colors.text.dim} /> : null)}
    </RowContainer>
  );
}

type SettingsToggleRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surface.level3, true: colors.accent.goldDim }}
        thumbColor={value ? colors.accent.goldBright : colors.text.mid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 24,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginLeft: -spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface.level1,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.text.mid,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.level2,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  rowSubtitle: {
    color: colors.text.mid,
    fontSize: typography.size.body,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.danger,
  },
});
