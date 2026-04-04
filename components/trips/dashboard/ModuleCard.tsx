/**
 * Module Card
 * Individual module entry point with progress indicator
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  priority: 'P1' | 'P2';
  progress?: number;
  isPrimary?: boolean;
  isImplemented?: boolean;
}

interface ModuleCardProps {
  module: ModuleDefinition;
  onPress: () => void;
}

export function ModuleCard({ module, onPress }: ModuleCardProps) {
  const Icon = module.icon;
  const hasProgress = typeof module.progress === 'number';
  const progressPercent = hasProgress ? module.progress : 0;

  return (
    <TouchableOpacity style={[styles.card, module.isPrimary && styles.primaryCard]} onPress={onPress} activeOpacity={0.7}>
      {module.isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>START HERE</Text>
        </View>
      )}

      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${module.color}20` },
            module.isPrimary && styles.primaryIconContainer,
          ]}
        >
          <Icon size={module.isPrimary ? 28 : 24} color={module.color} strokeWidth={2} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.moduleName, module.isPrimary && styles.primaryModuleName]}>{module.name}</Text>
          <Text style={styles.moduleDescription} numberOfLines={1}>
            {module.description}
          </Text>

          {hasProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent || 0}%`,
                      backgroundColor: module.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
          )}
        </View>
      </View>

      {!module.isImplemented && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    position: 'relative',
  },
  primaryCard: {
    backgroundColor: colors.surface.level2,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    padding: spacing.xl,
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: typography.size.meta - 1,
    fontWeight: typography.weight.label,
    color: colors.base,
    letterSpacing: typography.letterSpacing.wide,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconContainer: {
    width: 56,
    height: 56,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  moduleName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  primaryModuleName: {
    fontSize: typography.size.cardTitle + 2,
  },
  moduleDescription: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface.level3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    minWidth: 32,
    textAlign: 'right',
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface.level3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
});