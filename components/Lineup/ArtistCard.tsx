/**
 * ArtistCard Component
 * Displays artist with voting buttons and engagement signals
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThumbsUp, ThumbsDown, SkipForward } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { ArtistWithVotes, PreferenceType } from '@/lib/lineupTypes';

interface ArtistCardProps {
  artist: ArtistWithVotes;
  onVote: (preference: PreferenceType | null) => void;
  onGoingNow?: () => void;
  isGoingNow?: boolean;
  canEdit?: boolean;
}

export function ArtistCard({
  artist,
  onVote,
  onGoingNow,
  isGoingNow = false,
  canEdit = false,
}: ArtistCardProps) {
  const handleVotePress = (preference: PreferenceType) => {
    // Toggle vote off if already selected
    if (artist.user_vote === preference) {
      onVote(null);
    } else {
      onVote(preference);
    }
  };

  const totalVotes = artist.vote_counts.must_see + artist.vote_counts.want_to_see + artist.vote_counts.skip;

  return (
    <View style={styles.card}>
      {/* Artist Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.artistName}>{artist.name}</Text>
          {artist.genre && <Text style={styles.genre}>{artist.genre}</Text>}
          {artist.stage && <Text style={styles.stage}>{artist.stage}</Text>}
        </View>
        {artist.going_now_count > 0 && (
          <View style={styles.goingBadge}>
            <Text style={styles.goingBadgeText}>{artist.going_now_count} 🎉</Text>
          </View>
        )}
      </View>

      {/* Time Info */}
      {artist.start_time && artist.end_time && (
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {new Date(artist.start_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}{' '}
            -{' '}
            {new Date(artist.end_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
          {artist.day && <Text style={styles.dayText}>{artist.day}</Text>}
        </View>
      )}

      {/* Vote Buttons */}
      <View style={styles.voteSection}>
        <TouchableOpacity
          style={[styles.voteButton, artist.user_vote === 'must_see' && styles.voteButtonActive]}
          onPress={() => handleVotePress('must_see')}
        >
          <ThumbsUp
            size={18}
            color={artist.user_vote === 'must_see' ? colors.accent.gold : colors.text.primary}
          />
          <Text
            style={[
              styles.voteLabel,
              artist.user_vote === 'must_see' && styles.voteLabeActive,
            ]}
          >
            Must See
          </Text>
          {artist.vote_counts.must_see > 0 && (
            <Text style={styles.voteCount}>{artist.vote_counts.must_see}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteButton, artist.user_vote === 'want_to_see' && styles.voteButtonActive]}
          onPress={() => handleVotePress('want_to_see')}
        >
          <Text style={styles.voteButtonEmoji}>👀</Text>
          <Text
            style={[
              styles.voteLabel,
              artist.user_vote === 'want_to_see' && styles.voteLabeActive,
            ]}
          >
            Want
          </Text>
          {artist.vote_counts.want_to_see > 0 && (
            <Text style={styles.voteCount}>{artist.vote_counts.want_to_see}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteButton, artist.user_vote === 'skip' && styles.voteButtonActive]}
          onPress={() => handleVotePress('skip')}
        >
          <SkipForward
            size={18}
            color={artist.user_vote === 'skip' ? colors.accent.gold : colors.text.primary}
          />
          <Text
            style={[
              styles.voteLabel,
              artist.user_vote === 'skip' && styles.voteLabeActive,
            ]}
          >
            Skip
          </Text>
          {artist.vote_counts.skip > 0 && (
            <Text style={styles.voteCount}>{artist.vote_counts.skip}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Going Now Signal */}
      {onGoingNow && (
        <TouchableOpacity
          style={[styles.goingNowButton, isGoingNow && styles.goingNowButtonActive]}
          onPress={onGoingNow}
        >
          <Text style={styles.goingNowEmoji}>🏃</Text>
          <Text style={[styles.goingNowText, isGoingNow && styles.goingNowTextActive]}>
            {isGoingNow ? 'Going now!' : 'Head there?'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Vote Distribution Bar */}
      {totalVotes > 0 && (
        <View style={styles.distributionBar}>
          <View
            style={[
              styles.distributionSegment,
              styles.mustSeeSegment,
              { flex: artist.vote_counts.must_see },
            ]}
          />
          <View
            style={[
              styles.distributionSegment,
              styles.wantSegment,
              { flex: artist.vote_counts.want_to_see },
            ]}
          />
          <View
            style={[
              styles.distributionSegment,
              styles.skipSegment,
              { flex: artist.vote_counts.skip },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  artistName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  genre: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.xs,
  },
  stage: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  goingBadge: {
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  goingBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.headline,
    color: colors.base,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  timeText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  dayText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  voteSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level3,
    borderWidth: 1.5,
    borderColor: colors.border.medium,
  },
  voteButtonActive: {
    backgroundColor: colors.surface.level1,
    borderColor: colors.accent.gold,
  },
  voteLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  voteLabeActive: {
    color: colors.accent.gold,
  },
  voteButtonEmoji: {
    fontSize: 16,
  },
  voteCount: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.headline,
    color: colors.accent.gold,
    marginLeft: spacing.xs,
  },
  goingNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level3,
    borderWidth: 1.5,
    borderColor: colors.border.medium,
    marginBottom: spacing.md,
  },
  goingNowButtonActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.goldBright,
  },
  goingNowEmoji: {
    fontSize: 20,
  },
  goingNowText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  goingNowTextActive: {
    color: colors.base,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    gap: 1,
  },
  distributionSegment: {
    height: '100%',
  },
  mustSeeSegment: {
    backgroundColor: '#28C896', // Electric Forest green
  },
  wantSegment: {
    backgroundColor: colors.accent.gold,
  },
  skipSegment: {
    backgroundColor: colors.text.dim,
  },
});
