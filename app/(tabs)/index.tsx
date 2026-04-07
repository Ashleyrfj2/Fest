/**
 * App Home Screen (Level 1)
 *
 * Shows all enrolled festivals, community announcements, and app updates
 */

import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { EmailPromptBanner } from '@/components/EmailPromptBanner';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  member_role?: string;
  member_count?: number;
};

// Mock data
const festivals = [
  {
    id: '1',
    name: 'Electric Forest 2026',
    shortName: 'Electric Forest',
    dates: 'June 19–22, 2026',
    daysUntil: 92,
    progress: 0.68,
    role: 'Leader',
    crewCount: 8,
    crewAvatars: ['#28C896', '#C9A84C', '#B47AFF', '#F280B0'],
    gradientColors: ['#0A4D3A', '#12785A', '#28C896'],
    hasAlert: false,
  },
  {
    id: '2',
    name: 'Dancefestopia 2026',
    shortName: 'Dancefestopia',
    dates: 'September 4–6, 2026',
    daysUntil: 169,
    progress: 0.32,
    role: 'Editor',
    crewCount: 6,
    crewAvatars: ['#6D30CC', '#E5C96E', '#28C896'],
    gradientColors: ['#3B1578', '#6D30CC', '#B47AFF'],
    hasAlert: true,
  },
  {
    id: '3',
    name: 'Beyond Wonderland PNW 2026',
    shortName: 'Beyond Wonderland',
    dates: 'July 11–13, 2026',
    daysUntil: 114,
    progress: 0.51,
    role: 'Viewer',
    crewCount: 5,
    crewAvatars: ['#C42070', '#C9A84C', '#12785A'],
    gradientColors: ['#7A1048', '#C42070', '#F280B0'],
    hasAlert: false,
  },
];

const communityPosts = [
  {
    id: '1',
    author: 'FestNest Team',
    content: 'Electric Forest 2026 lineup drops next week! Enable notifications to get instant lineup import tools.',
    timestamp: '2h ago',
    isAdmin: true,
  },
  {
    id: '2',
    author: 'FestNest Team',
    content: 'New feature: Real-time "who\'s going?" signals in the Lineup Scheduler. Try it out!',
    timestamp: '1d ago',
    isAdmin: true,
  },
  {
    id: '3',
    author: 'Festival Scene',
    content: 'Beyond Wonderland PNW campsite maps are now available. Leaders can pre-load lot dimensions in Camp Grid.',
    timestamp: '3d ago',
    isAdmin: false,
  },
];

const appUpdates = [
  {
    id: '1',
    title: 'Camp Grid offline mode',
    description: 'Design your campsite layout without cell signal',
    icon: 'mapPin' as const,
  },
  {
    id: '2',
    title: 'Outfit voting is live',
    description: 'Upload photos and let your crew vote on group themes',
    icon: 'sparkles' as const,
  },
  {
    id: '3',
    title: 'Budget tracker improvements',
    description: 'Settle-up summary now shows who owes what',
    icon: 'trending' as const,
  },
];

export default function HomeScreen() {
  const { shouldPromptForEmail, userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, [userProfile]);

  async function loadTrips() {
    if (!userProfile) {
      setIsLoading(false);
      return;
    }

    try {
      // Get trips where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('trip_id, role')
        .eq('user_id', userProfile.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setTrips([]);
        setIsLoading(false);
        return;
      }

      const tripIds = memberData.map((m) => m.trip_id);

      // Get trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .order('start_date', { ascending: true });

      if (tripError) throw tripError;

      // Enrich with member info
      const enrichedTrips = await Promise.all(
        tripData.map(async (trip) => {
          const member = memberData.find((m) => m.trip_id === trip.id);

          // Get member count
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id);

          return {
            ...trip,
            member_role: member?.role,
            member_count: count || 0,
          };
        })
      );

      setTrips(enrichedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>FestNest</Text>
          <View style={styles.headerButtons}>
            <Pressable
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Icon name="settings" size={24} color={colors.text.mid} />
            </Pressable>
          </View>
        </View>

        {/* Email Prompt Banner (after 5+ min usage) */}
        {shouldPromptForEmail && <EmailPromptBanner />}

        {/* Festival Cards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>YOUR FESTIVALS</Text>
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/trips/create')}
            >
              <Icon name="plus" size={20} color={colors.accent.gold} />
              <Text style={styles.createButtonText}>Create Trip</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Loading trips...</Text>
          ) : trips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a trip or join one via invite link
              </Text>
            </View>
          ) : (
            trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </View>

        {/* Community Posts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMMUNITY</Text>
          {communityPosts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </View>

        {/* App Updates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT'S NEW</Text>
          <View style={styles.updatesGrid}>
            {appUpdates.map((update) => (
              <AppUpdateCard key={update.id} update={update} />
            ))}
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  // Calculate days until trip
  const daysUntil = Math.ceil(
    (new Date(trip.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Format dates
  const startDate = new Date(trip.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(trip.end_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Festival-specific gradient colors (fallback to generic if unknown)
  const gradientColors =
    trip.festival_name.toLowerCase().includes('forest')
      ? ['#0A4D3A', '#12785A', '#28C896']
      : trip.festival_name.toLowerCase().includes('dance')
      ? ['#3B1578', '#6D30CC', '#B47AFF']
      : trip.festival_name.toLowerCase().includes('beyond')
      ? ['#7A1048', '#C42070', '#F280B0']
      : ['#1C1829', '#252033', '#C9A84C']; // Generic

  const finalColors = [...gradientColors, 'transparent'];

  return (
    <Pressable
      style={styles.festivalCard}
      onPress={() => router.push(`/trips/${trip.id}`)}
    >
      {/* Layered gradient wash background */}
      <LinearGradient
        colors={finalColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.festivalGradient}
      />

      {/* Radial glow effect */}
      <LinearGradient
        colors={[gradientColors[1] + '20', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.festivalGlow}
      />

      {/* Content */}
      <View style={styles.festivalContent}>
        {/* Header row */}
        <View style={styles.festivalHeader}>
          <View style={styles.festivalTitleRow}>
            <Text style={styles.festivalName} numberOfLines={1}>
              {trip.name}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.surface.level3 }]}>
              <Text style={styles.roleBadgeText}>
                {trip.member_role || 'viewer'}
              </Text>
            </View>
          </View>
        </View>

        {/* Festival Name */}
        <Text style={styles.festivalDates}>{trip.festival_name}</Text>

        {/* Dates */}
        <Text style={styles.festivalDates}>
          {startDate} – {endDate}
        </Text>

        {/* Countdown */}
        {daysUntil > 0 && (
          <View style={styles.countdownRow}>
            <Icon name="clock" size={14} color={colors.text.dim} />
            <Text style={styles.countdownText}>{daysUntil} days until arrival</Text>
          </View>
        )}

        {/* Crew count */}
        <View style={styles.crewRow}>
          <Icon name="users" size={16} color={colors.text.dim} />
          <Text style={styles.crewCount}>
            {trip.member_count} {trip.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function FestivalCard({ festival }: { festival: typeof festivals[0] }) {
  const gradientColors = [...festival.gradientColors, 'transparent'];

  return (
    <Pressable style={styles.festivalCard}>
      {/* Layered gradient wash background */}
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.festivalGradient}
      />

      {/* Radial glow effect (simulated with second gradient) */}
      <LinearGradient
        colors={[festival.gradientColors[1] + '20', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.festivalGlow}
      />

      {/* Content */}
      <View style={styles.festivalContent}>
        {/* Header row */}
        <View style={styles.festivalHeader}>
          <View style={styles.festivalTitleRow}>
            <Text style={styles.festivalName} numberOfLines={1}>
              {festival.shortName}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.surface.level3 }]}>
              <Text style={styles.roleBadgeText}>{festival.role}</Text>
            </View>
          </View>
          {festival.hasAlert && (
            <View style={styles.alertDot} />
          )}
        </View>

        {/* Dates */}
        <Text style={styles.festivalDates}>{festival.dates}</Text>

        {/* Countdown */}
        <View style={styles.countdownRow}>
          <Icon name="clock" size={14} color={colors.text.dim} />
          <Text style={styles.countdownText}>{festival.daysUntil} days until arrival</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${festival.progress * 100}%`,
                  backgroundColor: festival.gradientColors[2],
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(festival.progress * 100)}% ready</Text>
        </View>

        {/* Crew avatars (rounded squares) */}
        <View style={styles.crewRow}>
          <View style={styles.crewAvatars}>
            {festival.crewAvatars.map((color, index) => (
              <View
                key={index}
                style={[
                  styles.crewAvatar,
                  { backgroundColor: color, marginLeft: index > 0 ? -8 : 0 },
                ]}
              />
            ))}
            {festival.crewCount > festival.crewAvatars.length && (
              <View
                style={[
                  styles.crewAvatar,
                  styles.crewAvatarMore,
                  { marginLeft: -8 },
                ]}
              >
                <Text style={styles.crewAvatarMoreText}>
                  +{festival.crewCount - festival.crewAvatars.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.crewCount}>{festival.crewCount} crew members</Text>
        </View>
      </View>
    </Pressable>
  );
}

function CommunityPostCard({ post }: { post: typeof communityPosts[0] }) {
  return (
    <View style={styles.communityCard}>
      <View style={styles.communityHeader}>
        <View style={styles.communityAuthorRow}>
          <Text style={styles.communityAuthor}>{post.author}</Text>
          {post.isAdmin && (
            <View style={styles.adminBadge}>
              <Icon name="check" size={10} color={colors.base} strokeWidth={3} />
            </View>
          )}
        </View>
        <Text style={styles.communityTimestamp}>{post.timestamp}</Text>
      </View>
      <Text style={styles.communityContent}>{post.content}</Text>
    </View>
  );
}

function AppUpdateCard({ update }: { update: typeof appUpdates[0] }) {
  return (
    <View style={styles.updateCard}>
      <View style={styles.updateIconContainer}>
        <Icon name={update.icon} size={20} color={colors.accent.gold} />
      </View>
      <Text style={styles.updateTitle}>{update.title}</Text>
      <Text style={styles.updateDescription}>{update.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
  },
  appTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsButton: {
    padding: spacing.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  createButtonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
  festivalCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...(Platform.OS === 'ios' ? shadows.card : {}),
    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' } as any : {}),
  },
  festivalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  festivalGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  festivalContent: {
    padding: spacing.lg,
  },
  festivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  festivalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  festivalName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.gold,
    marginLeft: spacing.sm,
  },
  festivalDates: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginBottom: spacing.md,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  countdownText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surface.level3,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  crewAvatars: {
    flexDirection: 'row',
  },
  crewAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.surface.level1,
  },
  crewAvatarMore: {
    backgroundColor: colors.surface.level3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarMoreText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  crewCount: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  communityCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  communityAuthor: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  adminBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityTimestamp: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  communityContent: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
  },
  updatesGrid: {
    gap: spacing.md,
  },
  updateCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  updateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  updateTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  updateDescription: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
  },
});
