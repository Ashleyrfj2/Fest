/**
 * ConflictWarning Component
 * Displays schedule conflicts between Must See artists
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { ScheduleConflict } from '@/lib/lineupTypes';

interface ConflictWarningProps {
  conflicts: ScheduleConflict[];
  onDismiss?: (conflictIndex: number) => void;
}

export function ConflictWarning({ conflicts, onDismiss }: ConflictWarningProps) {
  const [dismissedIndices, setDismissedIndices] = React.useState<Set<number>>(new Set());

  if (conflicts.length === 0) {
    return null;
  }

  const visibleConflicts = conflicts.filter((_, index) => !dismissedIndices.has(index));

  if (visibleConflicts.length === 0) {
    return null;
  }

  const handleDismiss = (index: number) => {
    const conflictIndex = conflicts.findIndex((c, i) => i === index && !dismissedIndices.has(i));
    setDismissedIndices((prev) => new Set([...prev, conflictIndex]));
    onDismiss?.(conflictIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={20} color="#FF6B6B" />
        <Text style={styles.title}>⏱️ Schedule Conflicts</Text>
      </View>

      {visibleConflicts.map((conflict, index) => {
        const startTime = new Date(conflict.overlap_start);
        const endTime = new Date(conflict.overlap_end);
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

        return (
          <View key={`${conflict.artist1_id}-${conflict.artist2_id}`} style={styles.conflictItem}>
            <View style={styles.conflictContent}>
              <View style={styles.artistsRow}>
                <Text style={styles.artistName}>{conflict.artist1_name}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.artistName}>{conflict.artist2_name}</Text>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Overlap:</Text>
                <Text style={styles.timeValue}>
                  {startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}{' '}
                  - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} ({Math.round(duration)}m)
                </Text>
              </View>

              <Text style={styles.message}>{conflict.reason}</Text>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismiss(index)}
              activeOpacity={0.6}
            >
              <X size={16} color={colors.text.dim} />
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.hint}>
        <Text style={styles.hintText}>💡 Tip: Check the Schedule to plan which shows to catch!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: '#FF6B6B',
  },
  conflictItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conflictContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  artistsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  artistName: {
    ...typography.body,
    color: colors.accent.gold,
    fontWeight: '700',
    flex: 1,
  },
  vs: {
    ...typography.caption,
    color: colors.text.dim,
    fontWeight: '700',
    marginHorizontal: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.text.mid,
    fontWeight: '600',
  },
  timeValue: {
    ...typography.caption,
    color: '#FF6B6B',
    fontWeight: '700',
    flex: 1,
  },
  message: {
    ...typography.caption,
    color: colors.text.mid,
    fontStyle: 'italic',
  },
  dismissButton: {
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  hint: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  hintText: {
    ...typography.caption,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
