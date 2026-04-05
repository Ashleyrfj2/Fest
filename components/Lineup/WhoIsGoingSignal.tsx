/**
 * WhoIsGoingSignal Component
 * Real-time "who's heading there now" coordination signal
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Navigation2, Smile } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface WhoIsGoingUser {
  id: string;
  display_name: string;
  avatar_color: string;
}

interface WhoIsGoingSignalProps {
  title?: string;
  goingUsers: WhoIsGoingUser[];
  currentUserId?: string;
}

export function WhoIsGoingSignal({ title = 'Who\'s heading there?', goingUsers, currentUserId }: WhoIsGoingSignalProps) {
  if (goingUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Smile size={32} color={colors.text.mid} />
        <Text style={styles.emptyText}>No one heading there yet</Text>
        <Text style={styles.emptySubtext}>Be the first to tap the signal!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Navigation2 size={18} color={colors.accent.gold} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{goingUsers.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.userList}
        scrollEventThrottle={16}
      >
        {goingUsers.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <View
              style={[styles.avatar, { backgroundColor: user.avatar_color }]}
            >
              <Text style={styles.avatarInitial}>
                {user.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName} numberOfLines={2}>
              {user.display_name}
            </Text>
            {user.id === currentUserId && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>you</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Text style={styles.hint}>← Scroll to see all →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
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
    ...typography.headline,
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...typography.body,
    color: colors.base,
    fontWeight: '700',
    fontSize: 12,
  },
  userList: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userItem: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border.strong,
  },
  avatarInitial: {
    ...typography.headline,
    color: colors.base,
    fontWeight: '700',
  },
  userName: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
    width: 56,
  },
  youBadge: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  youBadgeText: {
    ...typography.caption,
    color: colors.base,
    fontWeight: '700',
    fontSize: 10,
  },
  hint: {
    ...typography.caption,
    color: colors.text.dim,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyContainer: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.mid,
  },
});
