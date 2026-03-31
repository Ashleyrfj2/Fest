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
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { isValidInviteCode, isInviteExpired } from '@/lib/invites/invite-utils';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];

export default function JoinTripScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
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
      if (!isValidInviteCode(code)) {
        setError('Invalid invite code');
        setIsLoading(false);
        return;
      }

      // Load trip by invite code
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('invite_code', code)
        .single();

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

      // Get member count
      const { count, error: countError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripData.id);

      if (!countError && count !== null) {
        setMemberCount(count);
      }

      // Check if user is already a member
      if (session && userProfile) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('*')
          .eq('trip_id', tripData.id)
          .eq('user_id', userProfile.id)
          .single();

        if (memberData) {
          setAlreadyMember(true);
        }
      }
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
      // Add user to group_members
      const { error: joinError } = await supabase.from('group_members').insert({
        user_id: userProfile.id,
        trip_id: trip.id,
        role: 'viewer', // Default role for new members
        module_permissions: null,
      });

      if (joinError) {
        // Check if already a member (conflict error)
        if (joinError.code === '23505') {
          setAlreadyMember(true);
          setIsJoining(false);
          return;
        }
        throw joinError;
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        trip_id: trip.id,
        user_id: userProfile.id,
        action_type: 'member_joined',
        module: null,
        target_id: userProfile.id,
        description: `${userProfile.display_name} joined the trip`,
      });

      // Navigate to trip dashboard
      router.replace(`/trips/${trip.id}`);
    } catch (err: any) {
      console.error('Error joining trip:', err);
      setError(err.message || 'Failed to join trip. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!trip) {
    return null;
  }

  if (alreadyMember) {
    return (
      <View style={[styles.container, styles.centered]}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
