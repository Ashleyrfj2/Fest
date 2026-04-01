/**
 * Trip Dashboard (Level 2)
 * Per-trip view with module grid, progress, crew activity
 *
 * Modules: Camp Grid, Supply List, Food Planner, Travel, Lineup, Packing, Safety, Budget
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
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ArrowLeft,
  Settings,
  Share2,
  MapPin,
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Music,
  Backpack,
  Shield,
  DollarSign,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateInviteUrl } from '@/lib/invites/invite-utils';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
};

// Module definitions
const MODULES = [
  {
    id: 'camp_grid',
    name: 'Camp Grid',
    description: 'Design your campsite layout',
    icon: MapPin,
    color: '#28C896',
    priority: 'P1',
  },
  {
    id: 'supply_list',
    name: 'Supply List',
    description: "Who's bringing what",
    icon: ShoppingCart,
    color: '#C9A84C',
    priority: 'P1',
  },
  {
    id: 'food',
    name: 'Food Planner',
    description: 'Plan your meals',
    icon: UtensilsCrossed,
    color: '#6D30CC',
    priority: 'P2',
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Rides & meetup plans',
    icon: Car,
    color: '#4A9EFF',
    priority: 'P1',
  },
  {
    id: 'lineup',
    name: 'Lineup',
    description: 'Vote on artists',
    icon: Music,
    color: '#F280B0',
    priority: 'P2',
  },
  {
    id: 'packing',
    name: 'Packing',
    description: 'Track what you packed',
    icon: Backpack,
    color: '#FFB84D',
    priority: 'P2',
  },
  {
    id: 'safety',
    name: 'Safety',
    description: 'Emergency info',
    icon: Shield,
    color: '#FF6B6B',
    priority: 'P1',
  },
  {
    id: 'budget',
    name: 'Budget',
    description: 'Track & split expenses',
    icon: DollarSign,
    color: '#B47AFF',
    priority: 'P2',
  },
];

export default function TripDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTripData();
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

  function calculateDaysUntil(): number {
    if (!trip) return 0;
    const now = new Date();
    const start = new Date(trip.start_date);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (isLoading || !trip) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const daysUntil = calculateDaysUntil();
  const currentMember = members.find((m) => m.user_id === userProfile?.id);
  const isLeader = currentMember?.role === 'leader';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
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
                  // TODO: Navigate to settings
                  Alert.alert('Settings', 'Trip settings coming soon');
                }}
                activeOpacity={0.7}
              >
                <Settings size={24} color={colors.text.mid} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <Text style={styles.tripName}>{trip.name}</Text>
          <Text style={styles.festivalName}>{trip.festival_name}</Text>
          <View style={styles.tripMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.text.dim} strokeWidth={2} />
              <Text style={styles.metaText}>
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
            {daysUntil > 0 && (
              <Text style={styles.countdown}>{daysUntil} days until arrival</Text>
            )}
          </View>
        </View>

        {/* Crew */}
        <View style={styles.crewSection}>
          <Text style={styles.sectionLabel}>CREW ({members.length})</Text>
          <View style={styles.crewList}>
            {members.map((member) => (
              <View key={member.user_id} style={styles.crewMember}>
                <View
                  style={[
                    styles.crewAvatar,
                    { backgroundColor: member.user.avatar_color },
                  ]}
                />
                <View style={styles.crewInfo}>
                  <Text style={styles.crewName}>{member.user.display_name}</Text>
                  <Text style={styles.crewRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Modules Grid */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionLabel}>MODULES</Text>
          <View style={styles.modulesGrid}>
            {MODULES.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleCard}
                onPress={async () => {
                  if (module.id === 'camp_grid') {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {
                      // Keep navigation responsive if orientation lock is unavailable.
                    });
                    router.push(`/trips/${id}/camp-grid`);
                    return;
                  }
                  Alert.alert(module.name, `${module.name} coming soon`);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.moduleIconContainer,
                    { backgroundColor: `${module.color}20` },
                  ]}
                >
                  <module.icon size={24} color={module.color} strokeWidth={2} />
                </View>
                <Text style={styles.moduleName}>{module.name}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
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
  tripInfo: {
    marginBottom: spacing.xxxl,
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
    marginBottom: spacing.lg,
  },
  tripMeta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  countdown: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  crewSection: {
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
  crewList: {
    gap: spacing.md,
  },
  crewMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  crewAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.surface.level1,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  crewRole: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textTransform: 'capitalize',
  },
  modulesSection: {
    marginBottom: spacing.xxxl,
  },
  modulesGrid: {
    gap: spacing.md,
  },
  moduleCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  moduleName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  moduleDescription: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
});
