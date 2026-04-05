/**
 * ConsensusSection Component
 * Highlights artists with strong group agreement (3+ Must See votes)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { ConsensusArtist } from '@/lib/lineupTypes';

interface ConsensusSectionProps {
  consensusArtists: ConsensusArtist[];
  onArtistPress?: (artistId: string) => void;
}

export function ConsensusSection({ consensusArtists, onArtistPress }: ConsensusSectionProps) {
  if (consensusArtists.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Zap size={20} color={colors.accent.gold} />
        <Text style={styles.title}>Group Consensus</Text>
        <Text style={styles.subtitle}>3+ Must See votes</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {consensusArtists.map((artist) => (
          <TouchableOpacity
            key={artist.id}
            style={styles.card}
            onPress={() => onArtistPress?.(artist.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.artistName} numberOfLines={2}>
                {artist.name}
              </Text>

              {artist.genre && (
                <Text style={styles.genre} numberOfLines={1}>
                  {artist.genre}
                </Text>
              )}

              <View style={styles.voteCount}>
                <Text style={styles.voteCountEmoji}>👍</Text>
                <Text style={styles.voteCountText}>{artist.vote_count}</Text>
              </View>

              {artist.start_time && (
                <Text style={styles.time} numberOfLines={1}>
                  {new Date(artist.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.hint}>← Scroll to see all →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginLeft: 'auto',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  card: {
    width: 140,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardContent: {
    justifyContent: 'space-between',
  },
  artistName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.accent.gold,
    marginBottom: spacing.sm,
  },
  genre: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.sm,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  voteCountEmoji: {
    fontSize: 16,
  },
  voteCountText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.headline,
    color: colors.accent.gold,
  },
  time: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
  },
  hint: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
