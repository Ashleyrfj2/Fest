/**
 * Trip Dashboard (Level 2)
 * Per-trip operational command center
 *
 * Hierarchy:
 * 1. Where am I? → Trip identity + countdown
 * 2. What should I do next? → Quick stats + primary module
 * 3. Who is here with me? → Crew list
 * 4. Where can I go? → Module grid
 * 5. What's happening? → Activity feed
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ArrowLeft,
  Settings,
  Share2,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateInviteUrl } from '@/lib/invites/invite-utils';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';
import { QuickStatsHeader, ActivityFeed, ModuleCard, CrewSection } from '@/components/trips/dashboard';
import { MODULES } from '@/components/trips/dashboard/modules';
import { SafetyPromptBanner } from '@/components/SafetyProfile/SafetyPromptBanner';
import { useModuleProgress } from '@/lib/hooks/useModuleProgress';

type Trip = Database['public']['Tables']['trips']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
};
type ActivityLog = Database['public']['Tables']['activity_logs']['Row'] & {
  user?: Database['public']['Tables']['users']['Row'];
};

const visitedModuleIdsByTrip = new Map<string, Set<string>>();
const dismissedSafetyPromptByTrip = new Set<string>();

export default function TripDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitedModuleIds, setVisitedModuleIds] = useState<string[]>([]);
  const [isSafetyPromptDismissed, setIsSafetyPromptDismissed] = useState(false);

  // Get real progress from all modules
  const tripProgress = useModuleProgress(id || '', members);

  useEffect(() => {
    loadTripData();
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    setVisitedModuleIds(Array.from(visitedModuleIdsByTrip.get(id) ?? []));
    setIsSafetyPromptDismissed(dismissedSafetyPromptByTrip.has(id));
  }, [id]);

  async function loadTripData() {
    try {
      // Load trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*, user:users(*)')
        .eq('trip_id', id);

      if (membersError) throw membersError;
      setMembers(membersData as any);

      // Load recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('*, user:users(*)')
        .eq('trip_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;
      setActivities(activityData as any);
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShareInvite() {
    if (!trip) return;

    const inviteUrl = generateInviteUrl(trip.invite_code);

    try {
      await Share.share({
        message: `Join my ${trip.festival_name} trip on FestNest!\n\n${trip.name}\n${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  }

  function handleModulePress(moduleId: string) {
    if (id) {
      const nextVisitedModules = new Set(visitedModuleIdsByTrip.get(id) ?? []);
      nextVisitedModules.add(moduleId);
      visitedModuleIdsByTrip.set(id, nextVisitedModules);
      setVisitedModuleIds(Array.from(nextVisitedModules));
    }

    if (moduleId === 'camp_grid') {
      router.push(`/trips/${id}/camp-grid`);
      return;
    }

    if (moduleId === 'supply_list') {
      router.push(`/trips/${id}/supply-list`);
      return;
    }

    if (moduleId === 'travel') {
      router.push(`/trips/${id}/travel`);
      return;
    }

    if (moduleId === 'safety') {
      router.push(`/trips/${id}/safety-profile?tripId=${id}`);
      return;
    }

    if (moduleId === 'collaboration') {
      router.push(`/trips/${id}/collaboration`);
      return;
    }

    if (moduleId === 'packing') {
      router.push(`/trips/${id}/packing-checklist`);
      return;
    }

    if (moduleId === 'lineup') {
      router.push(`/trips/${id}/lineup`);
      return;
    }

    if (moduleId === 'food') {
      router.push(`/trips/${id}/food-planner`);
      return;
    }

    if (moduleId === 'budget') {
      router.push(`/trips/${id}/budget?tripId=${id}`);
      return;
    }

    // Other modules not yet implemented
    const module = MODULES.find((m) => m.id === moduleId);
    Alert.alert(module?.name || 'Coming Soon', `${module?.name} coming soon`);
  }

  function calculateDaysUntil(): number {
    if (!trip) return 0;
    const now = new Date();
    const start = new Date(trip.start_date);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  function handleBackToHome() {
    router.replace('/(tabs)/index');
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading trip...</Text>
      </SafeAreaView>
    );
  }

  // Error state - trip not found
  if (!trip) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Trip not found</Text>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={handleBackToHome}
          activeOpacity={0.7}
        >
          <Text style={styles.backToHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const daysUntil = calculateDaysUntil();
  const completionPercent = tripProgress.overallPercent;
  const currentMember = members.find((m) => m.user_id === userProfile?.id);
  const isLeader = currentMember?.role === 'leader';
  const shouldShowSafetyPrompt =
    !isSafetyPromptDismissed &&
    !tripProgress.safetySelfComplete &&
    visitedModuleIds.length >= 2;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToHome}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text.mid} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShareInvite}
              activeOpacity={0.7}
            >
              <Share2 size={24} color={colors.text.mid} strokeWidth={2} />
            </TouchableOpacity>
            {isLeader && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Alert.alert('Settings', 'Trip settings coming soon');
                }}
                activeOpacity={0.7}
              >
                <Settings size={24} color={colors.text.mid} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Trip Identity */}
        <View style={styles.tripIdentity}>
          <Text style={styles.tripName}>{trip.name}</Text>
          <Text style={styles.festivalName}>{trip.festival_name}</Text>
          <View style={styles.tripDates}>
            <Calendar size={16} color={colors.text.dim} strokeWidth={2} />
            <Text style={styles.datesText}>
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
        </View>

        {/* Quick Stats */}
        <QuickStatsHeader
          daysUntil={daysUntil}
          crewSize={members.length}
          completionPercent={completionPercent}
        />

        {shouldShowSafetyPrompt && (
          <View style={styles.section}>
            <SafetyPromptBanner
              onOpen={() => {
                if (id) {
                  dismissedSafetyPromptByTrip.add(id);
                  setIsSafetyPromptDismissed(true);
                }
                router.push(`/trips/${id}/safety-profile?tripId=${id}`);
              }}
              onDismiss={() => {
                if (id) {
                  dismissedSafetyPromptByTrip.add(id);
                  setIsSafetyPromptDismissed(true);
                }
              }}
            />
          </View>
        )}

        {/* Primary Module: Camp Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GET STARTED</Text>
          <ModuleCard
            module={{
              ...MODULES[0],
              progress: tripProgress.moduleProgress.camp_grid?.percent || 0,
            }}
            onPress={() => handleModulePress(MODULES[0].id)}
          />
        </View>

        {/* Crew */}
        <View style={styles.section}>
          <CrewSection
            members={members}
            isLeader={isLeader}
            onInvite={handleShareInvite}
          />
        </View>

        {/* Other Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL MODULES</Text>
          <View style={styles.modulesGrid}>
            {MODULES.slice(1).map((module) => (
              <ModuleCard
                key={module.id}
                module={{
                  ...module,
                  progress: tripProgress.moduleProgress[module.id]?.percent || 0,
                }}
                onPress={() => handleModulePress(module.id)}
              />
            ))}
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          <ActivityFeed
            activities={activities}
            emptyMessage="No activity yet. Start by setting up your camp!"
          />
        </View>
      </ScrollView>
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
  },
  loadingText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  errorText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  backToHomeButton: {
    backgroundColor: colors.surface.level1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  backToHomeText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripIdentity: {
    marginBottom: spacing.xl,
  },
  tripName: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.xs,
  },
  festivalName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.accent.gold,
    marginBottom: spacing.md,
  },
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  datesText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  modulesGrid: {
    gap: spacing.md,
  },
});
