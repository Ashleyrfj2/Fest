/**
 * Quick Stats Header
 * Shows countdown, crew size, and overall readiness at a glance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Users, CheckCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface QuickStatsHeaderProps {
  daysUntil: number;
  crewSize: number;
  completionPercent: number;
}

export function QuickStatsHeader({ daysUntil, crewSize, completionPercent }: QuickStatsHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <View style={styles.iconContainer}>
          <Calendar size={20} color={colors.accent.gold} strokeWidth={2} />
        </View>
        <Text style={styles.statValue}>{daysUntil}</Text>
        <Text style={styles.statLabel}>days until</Text>
      </View>

      <View style={styles.stat}>
        <View style={styles.iconContainer}>
          <Users size={20} color={colors.accent.gold} strokeWidth={2} />
        </View>
        <Text style={styles.statValue}>{crewSize}</Text>
        <Text style={styles.statLabel}>crew members</Text>
      </View>

      <View style={styles.stat}>
        <View style={styles.iconContainer}>
          <CheckCircle size={20} color={colors.accent.gold} strokeWidth={2} />
        </View>
        <Text style={styles.statValue}>{completionPercent}%</Text>
        <Text style={styles.statLabel}>ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.accent.gold}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.size.cardTitle + 2,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  statLabel: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
});