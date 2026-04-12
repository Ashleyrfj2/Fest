/**
 * Lineup Scheduler Screen
 * Artist voting, consensus, conflict detection, and schedule builder
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Search, Filter, ThumbsUp, Eye, SkipForward } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLineup } from '@/lib/hooks/useLineup';
import { supabase } from '@/lib/supabase';
import {
  ArtistCard,
  ConsensusSection,
  ConflictWarning,
  ScheduleBuilder,
  WhoIsGoingSignal,
  AddArtistModal,
} from '@/components/Lineup';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

export default function LineupSchedulerScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreference, setFilterPreference] = useState<'all' | 'must_see' | 'want_to_see' | 'skip'>('all');
  const [tripMembers, setTripMembers] = useState<User[]>([]);
  const [isAddingArtist, setIsAddingArtist] = useState(false);

  // Load lineup data
  const {
    artists,
    conflicts,
    consensusArtists,
    userGoingNow,
    isLoading,
    error,
    addArtist,
    updateArtist,
    deleteArtist,
    voteOnArtist,
    setGoingNow,
  } = useLineup(tripId, userProfile?.id);

  // Load user role
  useEffect(() => {
    loadUserRole();
  }, [tripId, userProfile?.id]);

  async function loadUserRole() {
    if (!userProfile?.id || !tripId) return;

    try {
      const { data } = await supabase
        .from('group_members')
        .select('role')
        .eq('trip_id', tripId)
        .eq('user_id', userProfile.id)
        .single();

      setCurrentRole(data?.role || null);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }

  function handleBackToTripDashboard() {
    if (tripId) {
      router.replace({ pathname: '/trips/[id]', params: { id: tripId } });
      return;
    }
    router.back();
  }

  // Load trip members for going now signals
  useEffect(() => {
    loadTripMembers();
  }, [tripId]);

  async function loadTripMembers() {
    if (!tripId) return;

    try {
      const { data } = await supabase
        .from('group_members')
        .select('user:users(*)')
        .eq('trip_id', tripId);

      if (data) {
        setTripMembers(
          data
            .map((m: any) => m.user)
            .filter((u: any) => u)
        );
      }
    } catch (error) {
      console.error('Error loading trip members:', error);
    }
  }

  const isEditor = currentRole === 'leader' || currentRole === 'editor';

  // Filter artists based on search and preference
  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPreference =
      filterPreference === 'all'
        ? true
        : filterPreference === 'must_see'
        ? artist.user_vote === 'must_see'
        : filterPreference === 'want_to_see'
        ? artist.user_vote === 'want_to_see'
        : artist.user_vote === 'skip';

    return matchesSearch && matchesPreference;
  });

  // Handle add artist
  async function handleAddArtist(formData: {
    name: string;
    stage?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    genre?: string;
  }) {
    setIsAddingArtist(true);
    try {
      const result = await addArtist(
        formData.name,
        formData.stage,
        formData.day,
        formData.startTime,
        formData.endTime,
        formData.genre
      );

      if (result.error) {
        Alert.alert('Error', result.error);
      }
    } finally {
      setIsAddingArtist(false);
    }
  }

  // Handle vote
  async function handleVote(artistId: string, preference: 'must_see' | 'want_to_see' | 'skip' | null) {
    const result = await voteOnArtist(artistId, preference);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // Handle going now
  async function handleGoingNow(artistId: string) {
    const isCurrentlyGoing = userGoingNow.has(artistId);
    const result = await setGoingNow(artistId, !isCurrentlyGoing);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // Get going now users for each artist
  const getGoingNowUsers = (artistId: string) => {
    return tripMembers.filter((member) => {
      const artistVote = artists
        .find((a) => a.id === artistId)
        ?.vote_counts;

      // This is a simplified version; in production,
      // we'd need to fetch this from the artist_votes table
      return userGoingNow.has(artistId) && member.id === userProfile?.id;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading lineup...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleBackToTripDashboard}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBackToTripDashboard} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lineup</Text>
          <Text style={styles.headerSubtitle}>{artists.length} artists</Text>
        </View>
        {isEditor && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            disabled={isAddingArtist}
          >
            <Plus size={24} color={colors.accent.gold} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Conflicts */}
        {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}

        {/* Consensus */}
        {consensusArtists.length > 0 && (
          <ConsensusSection consensusArtists={consensusArtists} />
        )}

        {/* Search & Filter */}
        <View style={styles.searchFilterSection}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.text.mid} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search artists..."
              placeholderTextColor={colors.text.dim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
            scrollEventThrottle={16}
          >
            {(['all', 'must_see', 'want_to_see', 'skip'] as const).map((pref) => {
              let label = 'All';
              let icon = null;
              if (pref === 'must_see') {
                label = 'Must See';
                icon = <ThumbsUp size={16} color={filterPreference === pref ? colors.accent.gold : colors.text.mid} />;
              } else if (pref === 'want_to_see') {
                label = 'Want to See';
                icon = <Eye size={16} color={filterPreference === pref ? colors.accent.gold : colors.text.mid} />;
              } else if (pref === 'skip') {
                label = 'Skip';
                icon = <SkipForward size={16} color={filterPreference === pref ? colors.accent.gold : colors.text.mid} />;
              }
              return (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.filterButton,
                    filterPreference === pref && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterPreference(pref)}
                >
                  {icon && <View style={{ marginRight: spacing.xs }}>{icon}</View>}
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterPreference === pref && styles.filterButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Artist List */}
        {filteredArtists.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {filterPreference === 'all' ? 'All Artists' : 'Filtered Results'} ({filteredArtists.length})
            </Text>
            {filteredArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onVote={(pref) => handleVote(artist.id, pref)}
                onGoingNow={() => handleGoingNow(artist.id)}
                isGoingNow={userGoingNow.has(artist.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No artists found' : 'No artists yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? `Try searching for a different artist`
                : isEditor
                ? 'Add artists to start voting!'
                : 'Waiting for organizers to add artists...'}
            </Text>
          </View>
        )}

        {/* Schedule Builder */}
        {consensusArtists.length > 0 && (
          <ScheduleBuilder artists={consensusArtists} />
        )}

        {/* Going Now Signal */}
        {artists.some((a) => a.going_now_count > 0) && (
          <WhoIsGoingSignal
            goingUsers={tripMembers
              .filter((m) => artists.some((a) => a.going_now_count > 0 && m.id === userProfile?.id))
              .slice(0, 5)}
            currentUserId={userProfile?.id}
          />
        )}

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {artists.length > 0
              ? `👥 Group voting active • 📍 ${consensusArtists.length} consensus picks`
              : '👥 Add artists to start building your festival plan'}
          </Text>
        </View>
      </ScrollView>

      {/* Add Artist Modal */}
      <AddArtistModal
        isVisible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddArtist}
        isLoading={isAddingArtist}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
    backgroundColor: colors.surface.level1,
  },
  backButton: {
    padding: spacing.sm,
  },
  addButton: {
    marginLeft: 'auto',
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.mid,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  searchFilterSection: {
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    ...typography.body,
  },
  filterButtons: {
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  filterButtonActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  filterButtonText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.base,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.mid,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.base,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.mid,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
