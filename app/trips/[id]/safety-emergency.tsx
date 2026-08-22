import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSafetyProfile } from '@/lib/hooks/useSafetyProfile';
import { SafetyProfileViewCard } from '@/components/SafetyProfile/SafetyProfileViewCard';
import { SafetyProfile } from '@/lib/safetyTypes';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { parseTripIdParam } from '@/lib/routing/routeParams';

type Member = {
  user_id: string;
  user: {
    display_name: string;
  } | null;
};

type GroupMemberRow = {
  user_id: string;
  user: { display_name: string } | Array<{ display_name: string }> | null;
};

export default function SafetyEmergencyScreen() {
  const { id: rawTripId } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = parseTripIdParam(rawTripId);
  const { userProfile } = useAuth();
  const { unlockEmergencyProfile } = useSafetyProfile(tripId || '');

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedProfile, setUnlockedProfile] = useState<SafetyProfile | null>(null);

  useEffect(() => {
    loadMembers();
  }, [tripId, userProfile?.id]);

  const selectedMemberName = useMemo(() => {
    if (!selectedUserId) return '';
    const member = members.find((m) => m.user_id === selectedUserId);
    return member?.user?.display_name || 'Member';
  }, [members, selectedUserId]);

  async function loadMembers() {
    if (!tripId || !userProfile?.id) {
      setLoadingMembers(false);
      return;
    }

    try {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, user:users(display_name)')
        .eq('trip_id', tripId);

      if (error) throw error;

      const normalizedMembers: Member[] = ((data as GroupMemberRow[] | null) ?? [])
        .map((row) => ({
          user_id: row.user_id,
          user: Array.isArray(row.user) ? (row.user[0] ?? null) : row.user,
        }))
        .filter((m) => m.user_id !== userProfile.id);
      setMembers(normalizedMembers);
    } catch (err) {
      console.error('[SafetyEmergencyScreen] Failed to load members:', err);
      Alert.alert('Error', 'Could not load trip members.');
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleUnlock() {
    if (!selectedUserId) {
      Alert.alert('Select Member', 'Choose a member to unlock first.');
      return;
    }

    if (!/^\d{4,12}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Enter a 4 to 12 digit emergency PIN.');
      return;
    }

    try {
      setUnlocking(true);
      const profile = await unlockEmergencyProfile(selectedUserId, pin);
      setUnlockedProfile(profile);
    } catch (err: any) {
      Alert.alert('Unlock Failed', err?.message || 'Could not unlock emergency card.');
      setUnlockedProfile(null);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (tripId) {
              router.replace({ pathname: '/trips/[id]', params: { id: tripId } });
              return;
            }
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Access</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>PIN Required</Text>
          <Text style={styles.noticeText}>
            You can only unlock another member&apos;s safety card if they shared their emergency PIN with you. Existing cards may still use a legacy 4-7 digit PIN; new PINs require 8-12 digits.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Crew Member</Text>
        {loadingMembers ? (
          <ActivityIndicator size="small" color={colors.accent.gold} />
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>No other crew members found for this trip.</Text>
        ) : (
          <View style={styles.memberList}>
            {members.map((member) => {
              const selected = selectedUserId === member.user_id;
              return (
                <TouchableOpacity
                  key={member.user_id}
                  style={[styles.memberButton, selected && styles.memberButtonSelected]}
                  onPress={() => {
                    setSelectedUserId(member.user_id);
                    setUnlockedProfile(null);
                  }}
                >
                  <Text style={[styles.memberButtonText, selected && styles.memberButtonTextSelected]}>
                    {member.user?.display_name || 'Member'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Enter Emergency PIN</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          style={styles.pinInput}
          placeholder="4-12 digit PIN"
          placeholderTextColor={colors.text.dim}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={12}
        />

        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} disabled={unlocking}>
          {unlocking ? (
            <ActivityIndicator size="small" color={colors.base} />
          ) : (
            <Text style={styles.unlockButtonText}>
              Unlock {selectedMemberName ? `${selectedMemberName}'s` : 'Member'} Card
            </Text>
          )}
        </TouchableOpacity>

        {unlockedProfile && (
          <View style={styles.unlockedSection}>
            <Text style={styles.sectionTitle}>Unlocked Emergency Card</Text>
            <SafetyProfileViewCard profile={unlockedProfile} isOwn={false} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.level1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.size.body + 3,
    color: colors.accent.gold,
    fontWeight: typography.weight.label,
  },
  headerTitle: {
    fontSize: typography.size.cardTitle + 1,
    color: colors.text.primary,
    fontWeight: typography.weight.cardTitle,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  noticeCard: {
    backgroundColor: colors.surface.level1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  noticeTitle: {
    fontSize: typography.size.cardTitle,
    color: colors.accent.gold,
    fontWeight: typography.weight.cardTitle,
    marginBottom: 6,
  },
  noticeText: {
    fontSize: typography.size.body + 1,
    color: colors.text.mid,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.size.cardTitle,
    color: colors.text.primary,
    fontWeight: typography.weight.cardTitle,
    marginBottom: spacing.md,
  },
  memberList: {
    marginBottom: spacing.xl,
  },
  memberButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level1,
    marginBottom: spacing.sm,
  },
  memberButtonSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.surface.level2,
  },
  memberButtonText: {
    fontSize: typography.size.body + 2,
    color: colors.text.primary,
    fontWeight: typography.weight.label,
  },
  memberButtonTextSelected: {
    color: colors.accent.gold,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level1,
    color: colors.text.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.body + 2,
    marginBottom: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  unlockButtonText: {
    fontSize: typography.size.body + 2,
    color: colors.base,
    fontWeight: typography.weight.cardTitle,
  },
  unlockedSection: {
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.text.mid,
    fontSize: typography.size.body + 1,
    marginBottom: spacing.xl,
  },
});
