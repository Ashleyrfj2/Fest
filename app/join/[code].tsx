/**
 * Invite Landing Page
 * Shows trip preview and allows user to join
 *
 * Flow: Tap invite link → see preview → join trip → redirect to dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { isValidInviteCode, isInviteExpired } from '@/lib/invites/invite-utils';
import { parseInviteCodeParam } from '@/lib/routing/routeParams';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Trip = Pick<
  Database['public']['Tables']['trips']['Row'],
  'id' | 'name' | 'festival_name' | 'start_date' | 'end_date' | 'invite_expires_at'
> & {
  member_count: number;
  already_member: boolean;
};

export default function JoinTripScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code?: string | string[] }>();
  const code = parseInviteCodeParam(rawCode);
  const { session, userProfile } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    loadTripPreview();
  }, [code]);

  async function loadTripPreview() {
    try {
      // Validate code format
      if (!code || !isValidInviteCode(code)) {
        setError('Invalid invite code');
        setIsLoading(false);
        return;
      }

      // Preview access is intentionally granted by a narrowly scoped RPC;
      // non-members must not query the trips table directly.
      const { data: previewRows, error: tripError } = await supabase.rpc(
        'get_trip_invite_preview',
        { p_invite_code: code }
      );
      const tripData = previewRows?.[0];

      if (tripError || !tripData) {
        setError('Trip not found');
        setIsLoading(false);
        return;
      }

      // Check if invite expired
      if (isInviteExpired(tripData.invite_expires_at)) {
        setError('This invite link has expired');
        setIsLoading(false);
        return;
      }

      setTrip(tripData);
      setMemberCount(tripData.member_count);
      setAlreadyMember(tripData.already_member);
    } catch (err: any) {
      console.error('Error loading trip preview:', err);
      setError('Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinTrip() {
    if (!trip) return;

    // If no session, redirect to guest setup with trip code
    if (!session) {
      router.push(`/auth/guest-setup?tripCode=${code}`);
      return;
    }

    // If session but no profile, this shouldn't happen due to routing logic
    // but handle it just in case
    if (!userProfile) {
      router.push(`/onboarding/set-profile?tripCode=${code}`);
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const { data: joinedTripId, error: joinError } = await supabase.rpc(
        'join_trip_with_invite',
        { p_invite_code: code }
      );

      if (joinError) {
        // Check if already a member (conflict error)
        if (joinError.code === '23505') {
          setAlreadyMember(true);
          setIsJoining(false);
          return;
        }
        throw joinError;
      }

      if (!joinedTripId) {
        throw new Error('Failed to join trip: no trip ID returned');
      }

      // Use the trip ID returned by the server-side join operation. The
      // preview can become stale if an invite is changed between preview and
      // join, so it must not be the authority for the activity row.
      await supabase.from('activity_logs').insert({
        trip_id: joinedTripId,
        user_id: userProfile.id,
        action_type: 'member_joined',
        module: null,
        target_id: userProfile.id,
        description: `${userProfile.display_name} joined the trip`,
      });

      // Navigate to trip dashboard
      router.replace(`/trips/${joinedTripId}`);
    } catch (err: any) {
      console.error('Error joining trip:', err);
      setError(err.message || 'Failed to join trip. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return null;
  }

  if (alreadyMember) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <View style={styles.successIcon}>
          <CheckCircle size={64} color={colors.accent.gold} strokeWidth={2} />
        </View>
        <Text style={styles.successTitle}>You're already in!</Text>
        <Text style={styles.successMessage}>
          You're a member of {trip.name}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(`/trips/${trip.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Go to Trip</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.inviteTitle}>You're invited!</Text>
          <Text style={styles.inviteSubtitle}>
            Join this festival trip and start planning with your crew
          </Text>
        </View>

        {/* Trip Preview Card */}
        <View style={styles.tripCard}>
          <Text style={styles.tripName}>{trip.name}</Text>
          <View style={styles.tripDetails}>
            <View style={styles.detailRow}>
              <MapPin size={20} color={colors.text.mid} strokeWidth={2} />
              <Text style={styles.detailText}>{trip.festival_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar size={20} color={colors.text.mid} strokeWidth={2} />
              <Text style={styles.detailText}>
                {new Date(trip.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' – '}
                {new Date(trip.end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Users size={20} color={colors.text.mid} strokeWidth={2} />
              <Text style={styles.detailText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
          onPress={handleJoinTrip}
          disabled={isJoining}
          activeOpacity={0.8}
        >
          {isJoining ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.joinButtonText}>Join Trip</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You'll be able to see trip details, contribute to planning, and chat with your crew
        </Text>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: spacing.xxl,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  inviteTitle: {
    fontSize: 32,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.md,
  },
  inviteSubtitle: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: 22,
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.medium,
    marginBottom: spacing.xl,
  },
  tripName: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  tripDetails: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  joinButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  joinButtonDisabled: {
    opacity: 0.4,
  },
  joinButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  infoText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  successMessage: {
    fontSize: 15,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
