import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Crown, Shield, Share2, UserCheck, UserMinus, Users } from 'lucide-react-native';
import { useCollaboration } from '@/lib/hooks/useCollaboration';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateInviteUrl } from '@/lib/invites/invite-utils';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Role = Database['public']['Tables']['group_members']['Row']['role'];

type TripSummary = Pick<
  Database['public']['Tables']['trips']['Row'],
  'id' | 'name' | 'festival_name' | 'invite_code'
>;

const LEAD_MODULES = [
  { id: 'food', label: 'Food' },
  { id: 'camp_grid', label: 'Camp' },
  { id: 'safety', label: 'Safety' },
  { id: 'travel', label: 'Travel' },
] as const;

const ROLE_OPTIONS: Role[] = ['leader', 'editor', 'viewer'];

export default function CollaborationScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const {
    members,
    approvalQueue,
    hasApprovalQueueTable,
    currentUserRole,
    isLoading,
    error,
    updateRole,
    removeMember,
    transferLeadership,
    setModuleLead,
  } = useCollaboration(tripId);

  const [trip, setTrip] = useState<TripSummary | null>(null);

  const isLeader = currentUserRole === 'leader';

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.role === 'leader' ? -1 : b.role === 'leader' ? 1 : 0)),
    [members]
  );

  useEffect(() => {
    if (!tripId) return;
    void loadTripSummary();
  }, [tripId]);

  async function loadTripSummary() {
    const { data, error: tripError } = await supabase
      .from('trips')
      .select('id, name, festival_name, invite_code')
      .eq('id', tripId)
      .single();

    if (tripError) {
      console.error('Error loading collaboration trip summary:', tripError);
      return;
    }

    setTrip(data as TripSummary);
  }

  async function handleShareInvite() {
    if (!trip) return;

    const inviteUrl = generateInviteUrl(trip.invite_code);

    try {
      await Share.share({
        message: `Join my ${trip.festival_name} trip on FestNest!\n\n${trip.name}\n${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (shareError) {
      console.error('Error sharing invite URL:', shareError);
    }
  }

  function roleBadgeStyles(role: Role) {
    if (role === 'leader') {
      return {
        backgroundColor: `${colors.accent.gold}24`,
        color: colors.accent.gold,
        borderColor: `${colors.accent.gold}44`,
      };
    }

    if (role === 'editor') {
      return {
        backgroundColor: `${colors.festival.dancefestopia.mid}22`,
        color: colors.festival.dancefestopia.mid,
        borderColor: `${colors.festival.dancefestopia.mid}55`,
      };
    }

    return {
      backgroundColor: `${colors.text.dim}20`,
      color: colors.text.mid,
      borderColor: `${colors.text.dim}55`,
    };
  }

  async function handleRoleUpdate(memberUserId: string, nextRole: Role) {
    if (nextRole === 'leader') {
      Alert.alert(
        'Transfer Leadership',
        'This will transfer trip leadership to this member. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer',
            style: 'destructive',
            onPress: async () => {
              const result = await transferLeadership(memberUserId);
              if (result.error) {
                Alert.alert('Could not transfer leadership', result.error);
              }
            },
          },
        ]
      );
      return;
    }

    const result = await updateRole(memberUserId, nextRole);
    if (result.error) {
      Alert.alert('Could not update role', result.error);
    }
  }

  async function handleRemoveMember(memberUserId: string, memberName: string) {
    Alert.alert('Remove Member', `Remove ${memberName} from this trip?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await removeMember(memberUserId);
          if (result.error) {
            Alert.alert('Could not remove member', result.error);
          }
        },
      },
    ]);
  }

  async function handleTransferLeadership(memberUserId: string, memberName: string) {
    Alert.alert(
      'Transfer Leadership',
      `Transfer leadership to ${memberName}? You will become an editor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            const result = await transferLeadership(memberUserId);
            if (result.error) {
              Alert.alert('Could not transfer leadership', result.error);
            }
          },
        },
      ]
    );
  }

  async function handleSetModuleLead(moduleId: string, memberUserId: string | null) {
    const result = await setModuleLead(moduleId, memberUserId);
    if (result.error) {
      Alert.alert('Could not update module lead', result.error);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading crew...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Failed to load collaboration hub</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(`/trips/${tripId}`)}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Crew</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareInvite}
          activeOpacity={0.7}
        >
          <Share2 size={20} color={colors.base} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Members</Text>
          </View>

          {sortedMembers.length <= 1 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No crew members yet</Text>
              <Text style={styles.emptyMessage}>Share your invite link to add crew.</Text>
            </View>
          ) : (
            sortedMembers.map((member) => {
              const badge = roleBadgeStyles(member.role);
              const isSelf = member.user_id === userProfile?.id;
              const displayName = member.user?.display_name ?? 'Crew Member';

              return (
                <View key={member.user_id} style={styles.memberRow}>
                  <View style={styles.memberMain}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: member.user?.avatar_color ?? colors.surface.level3 },
                      ]}
                    >
                      <Text style={styles.avatarInitial}>
                        {displayName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.memberMeta}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{displayName}</Text>
                        {member.role === 'leader' && (
                          <Crown size={14} color={colors.accent.gold} strokeWidth={2} />
                        )}
                        {isSelf && <Text style={styles.youTag}>You</Text>}
                      </View>

                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: badge.backgroundColor,
                            borderColor: badge.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.roleBadgeText, { color: badge.color }]}>
                          {member.role}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isLeader && !isSelf && (
                    <View style={styles.memberControls}>
                      <View style={styles.rolePickerRow}>
                        {ROLE_OPTIONS.map((roleOption) => {
                          const isSelected = member.role === roleOption;
                          return (
                            <TouchableOpacity
                              key={roleOption}
                              style={[
                                styles.roleOption,
                                isSelected && styles.roleOptionActive,
                              ]}
                              onPress={() => handleRoleUpdate(member.user_id, roleOption)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.roleOptionText,
                                  isSelected && styles.roleOptionTextActive,
                                ]}
                              >
                                {roleOption}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.memberActionRow}>
                        <TouchableOpacity
                          style={styles.transferButton}
                          onPress={() => handleTransferLeadership(member.user_id, displayName)}
                          activeOpacity={0.7}
                        >
                          <UserCheck size={14} color={colors.accent.gold} strokeWidth={2} />
                          <Text style={styles.transferButtonText}>Transfer leadership</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveMember(member.user_id, displayName)}
                          activeOpacity={0.7}
                        >
                          <UserMinus size={14} color={colors.danger} strokeWidth={2} />
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Module Leads</Text>
          </View>

          {LEAD_MODULES.map((moduleDef) => {
            const leadMember = members.find((member) =>
              (member.module_permissions ?? []).includes(moduleDef.id)
            );

            return (
              <View key={moduleDef.id} style={styles.moduleLeadRow}>
                <View style={styles.moduleLeadHeader}>
                  <Text style={styles.moduleLeadLabel}>{moduleDef.label}</Text>
                  <Text style={styles.moduleLeadCurrent}>
                    {leadMember?.user?.display_name ?? 'Unassigned'}
                  </Text>
                </View>

                {isLeader ? (
                  <View style={styles.moduleLeadControls}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.leadPillRow}>
                        <TouchableOpacity
                          style={[
                            styles.leadPill,
                            !leadMember && styles.leadPillActive,
                          ]}
                          onPress={() => handleSetModuleLead(moduleDef.id, null)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.leadPillText,
                              !leadMember && styles.leadPillTextActive,
                            ]}
                          >
                            Unassign
                          </Text>
                        </TouchableOpacity>

                        {members
                          .filter((member) => member.role !== 'leader')
                          .map((member) => {
                            const selected = (member.module_permissions ?? []).includes(moduleDef.id);
                            const name = member.user?.display_name ?? 'Crew Member';

                            return (
                              <TouchableOpacity
                                key={`${moduleDef.id}-${member.user_id}`}
                                style={[styles.leadPill, selected && styles.leadPillActive]}
                                onPress={() => handleSetModuleLead(moduleDef.id, member.user_id)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.leadPillText,
                                    selected && styles.leadPillTextActive,
                                  ]}
                                >
                                  {name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.moduleLeadReadonlyText}>
                    Only the leader can update module leads.
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <UserCheck size={18} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Approval Queue</Text>
          </View>

          {!hasApprovalQueueTable ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Approval queue is not configured</Text>
              <Text style={styles.emptyMessage}>
                No proposals table exists in this schema yet, so this section is safely stubbed.
              </Text>
            </View>
          ) : approvalQueue.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No pending approvals</Text>
              <Text style={styles.emptyMessage}>Editor-proposed changes will appear here.</Text>
            </View>
          ) : (
            approvalQueue.map((proposal) => (
              <View key={proposal.id} style={styles.queueItem}>
                <Text style={styles.queueTitle}>{proposal.description}</Text>
                <Text style={styles.queueMeta}>{new Date(proposal.created_at).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  errorTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  errorMessage: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  emptyMessage: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  memberRow: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    padding: spacing.md,
    gap: spacing.md,
  },
  memberMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
  },
  memberMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  youTag: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    textTransform: 'capitalize',
  },
  memberControls: {
    gap: spacing.sm,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleOption: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface.level3,
  },
  roleOptionActive: {
    borderColor: colors.accent.gold,
    backgroundColor: `${colors.accent.gold}26`,
  },
  roleOptionText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'capitalize',
  },
  roleOptionTextActive: {
    color: colors.accent.gold,
  },
  memberActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.accent.gold}44`,
    backgroundColor: `${colors.accent.gold}18`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  transferButtonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
    backgroundColor: `${colors.danger}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.danger,
  },
  moduleLeadRow: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  moduleLeadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  moduleLeadLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  moduleLeadCurrent: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  moduleLeadControls: {
    gap: spacing.xs,
  },
  leadPillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  leadPill: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  leadPillActive: {
    borderColor: colors.accent.gold,
    backgroundColor: `${colors.accent.gold}24`,
  },
  leadPillText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  leadPillTextActive: {
    color: colors.accent.gold,
  },
  moduleLeadReadonlyText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  queueItem: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  queueTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  queueMeta: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
});
