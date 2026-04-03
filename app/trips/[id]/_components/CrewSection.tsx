/**
 * Crew Section
 * Shows trip members with avatars and roles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
};

interface CrewSectionProps {
  members: GroupMember[];
  isLeader: boolean;
  onInvite?: () => void;
}

export function CrewSection({ members, isLeader, onInvite }: CrewSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>CREW ({members.length})</Text>
        {isLeader && onInvite && (
          <TouchableOpacity style={styles.inviteButton} onPress={onInvite} activeOpacity={0.7}>
            <UserPlus size={16} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.membersList}>
        {members.map((member) => (
          <View key={member.user_id} style={styles.memberCard}>
            <View style={[styles.avatar, { backgroundColor: member.user.avatar_color }]} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.user.display_name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface.level1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  inviteText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  membersList: {
    gap: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.surface.level2,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  memberRole: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textTransform: 'capitalize',
  },
});
