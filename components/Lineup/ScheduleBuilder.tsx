/**
 * ScheduleBuilder Component
 * Shared chronological view of consensus artists (agreed upon shows)
 */

import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { ConsensusArtist } from '@/lib/lineupTypes';

interface ScheduleBuilderProps {
  artists: ConsensusArtist[];
  onArtistPress?: (artistId: string) => void;
}

export function ScheduleBuilder({ artists, onArtistPress }: ScheduleBuilderProps) {
  /**
   * Group artists by day for section list
   */
  const groupedByDay = React.useMemo(() => {
    const groups: Record<string, ConsensusArtist[]> = {};

    artists.forEach((artist) => {
      const day = artist.day || 'Unscheduled';
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(artist);
    });

    // Sort each day's artists by start time
    Object.keys(groups).forEach((day) => {
      groups[day].sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
    });

    // Convert to SectionList format
    return Object.entries(groups)
      .sort(([dayA], [dayB]) => {
        // Sort days chronologically if possible
        const order: Record<string, number> = {
          'Thursday': 0,
          'Friday': 1,
          'Saturday': 2,
          'Sunday': 3,
          'Monday': 4,
        };
        return (order[dayA] ?? 999) - (order[dayB] ?? 999);
      })
      .map(([day, dayArtists]) => ({
        title: day,
        data: dayArtists,
      }));
  }, [artists]);

  if (artists.length === 0) {
    return null;
  }

  const ScheduleItem = ({ item }: { item: ConsensusArtist }) => {
    return (
      <TouchableOpacity
        style={styles.scheduleItem}
        onPress={() => onArtistPress?.(item.id)}
        activeOpacity={0.7}
      >
        {item.start_time && (
          <View style={styles.timeSection}>
            <Text style={styles.time}>
              {new Date(item.start_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
            {item.end_time && (
              <Text style={styles.duration}>
                {Math.round(
                  (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) /
                    (1000 * 60)
                )}
                m
              </Text>
            )}
          </View>
        )}

        <View style={styles.artistInfo}>
          <Text style={styles.artistName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.metadata}>
            {item.genre && (
              <Text style={styles.metaText} numberOfLines={1}>
                🎵 {item.genre}
              </Text>
            )}
            {item.stage && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.accent.gold} />
                <Text style={styles.metaText}>{item.stage}</Text>
              </View>
            )}
            {item.vote_count > 0 && (
              <View style={styles.metaItem}>
                <Users size={12} color={colors.accent.gold} />
                <Text style={[styles.metaText, styles.voteText]}>
                  {item.vote_count} votes
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const SectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Calendar size={16} color={colors.accent.gold} />
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {groupedByDay.find((s) => s.title === section.title)?.data.length || 0} shows
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={20} color={colors.accent.gold} />
        <View>
          <Text style={styles.title}>Shared Schedule</Text>
          <Text style={styles.subtitle}>Consensus picks in order</Text>
        </View>
      </View>

      <SectionList
        sections={groupedByDay}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ScheduleItem item={item} />}
        renderSectionHeader={({ section }) => <SectionHeader section={section} />}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          👥 {artists.length} show{artists.length !== 1 ? 's' : ''} with group agreement
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
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
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sectionTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    flex: 1,
  },
  sectionCount: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  timeSection: {
    alignItems: 'center',
    minWidth: 50,
  },
  time: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.headline,
    color: colors.accent.gold,
  },
  duration: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    marginTop: spacing.xs,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  voteText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  chevron: {
    justifyContent: 'center',
    width: 24,
  },
  chevronText: {
    fontSize: 24,
    fontWeight: typography.weight.headline,
    color: colors.text.dim,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    backgroundColor: colors.surface.level3,
  },
  footerText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textAlign: 'center',
  },
});
