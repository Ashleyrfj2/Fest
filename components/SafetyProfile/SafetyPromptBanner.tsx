/**
 * Safety Prompt Banner
 * Soft prompt for the private emergency profile after a user has explored a few modules.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, Shield, X } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';

interface SafetyPromptBannerProps {
  onOpen: () => void;
  onDismiss: () => void;
}

export function SafetyPromptBanner({ onOpen, onDismiss }: SafetyPromptBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Shield size={20} color={colors.base} strokeWidth={2} />
        </View>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add your emergency info</Text>
            <View style={styles.privatePill}>
              <Text style={styles.privatePillText}>Private</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Emergency contact and medical details help your crew if something goes wrong.
          </Text>
          <View style={styles.noteRow}>
            <AlertTriangle size={14} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.noteText}>Only you can edit it. Works offline.</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onOpen} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Add now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.8}>
          <X size={18} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.22)',
    backgroundColor: colors.surface.level1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  privatePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(201, 168, 76, 0.16)',
  },
  privatePillText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
    letterSpacing: typography.letterSpacing.wide,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: 20,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  noteText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  dismissButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});
