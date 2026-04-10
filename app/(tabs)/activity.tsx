import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Activity, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivityFeed } from '@/lib/hooks/useActivityFeed';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';

type ActivityFeedItem = Database['public']['Tables']['activity_logs']['Row'] & {
  trip?: Pick<Database['public']['Tables']['trips']['Row'], 'name' | 'festival_name'> | null;
  user?: Pick<Database['public']['Tables']['users']['Row'], 'display_name' | 'avatar_color'> | null;
};

type FeedListRow =
  | { id: string; type: 'header'; title: string }
  | { id: string; type: 'item'; item: ActivityFeedItem };

export default function ActivityScreen() {
  const { feedItems, isLoading, isRefreshing, error, refresh } = useActivityFeed();

  const rows = useMemo<FeedListRow[]>(() => {
    const nextRows: FeedListRow[] = [];
    let currentLabel = '';

    for (const item of feedItems) {
      const label = getSectionLabel(item.created_at);

      if (label !== currentLabel) {
        currentLabel = label;
        nextRows.push({ id: `header-${label}`, type: 'header', title: label });
      }

      nextRows.push({ id: item.id, type: 'item', item });
    }

    return nextRows;
  }, [feedItems]);

  const stickyHeaderIndices = useMemo(
    () => rows.map((row, index) => (row.type === 'header' ? index : -1)).filter((index) => index >= 0),
    [rows]
  );

  const showInitialLoading = isLoading && feedItems.length === 0;

  if (showInitialLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.screenHeader}>
          <Text style={styles.title}>Activity</Text>
        </View>
        <View style={styles.centeredState}>
          <Text style={styles.subtitle}>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        stickyHeaderIndices={stickyHeaderIndices}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.accent.gold} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.screenHeader}>
            <Text style={styles.title}>Activity</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centeredState}>
            {error ? (
              <>
                <View style={styles.stateIconContainer}>
                  <AlertCircle size={20} color={colors.danger} />
                </View>
                <Text style={styles.errorTitle}>Couldn&apos;t load activity</Text>
                <Text style={styles.subtitle}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={() => void refresh()}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.stateIconContainer}>
                  <Activity size={20} color={colors.text.mid} />
                </View>
                <Text style={styles.subtitle}>No activity yet - join or create a trip to get started.</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <View style={styles.groupHeaderWrap}>
                <Text style={styles.groupHeader}>{row.title}</Text>
              </View>
            );
          }

          const item = row.item;
          const displayName = item.user?.display_name || 'Someone';
          const initials = getInitials(displayName);

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/trips/${item.trip_id}`)}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: item.user?.avatar_color || colors.accent.gold },
                ]}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.cardMain}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.descriptionText}>
                    <Text style={styles.nameText}>{displayName}</Text>
                    {' '}
                    {item.description}
                  </Text>
                  <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.tripBadge}>
                    <Text style={styles.tripBadgeText}>{item.trip?.festival_name || item.trip?.name || 'Trip'}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSectionLabel(isoTimestamp: string): string {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const itemDate = new Date(isoTimestamp);
  const itemDay = startOfDay(itemDate);

  if (itemDay.getTime() === today.getTime()) return 'Today';
  if (itemDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return itemDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function getRelativeTime(isoTimestamp: string): string {
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) {
    return then.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return '?';

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  screenHeader: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  stateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.goldDim,
    backgroundColor: colors.surface.level1,
  },
  retryButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  groupHeaderWrap: {
    backgroundColor: colors.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  groupHeader: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    letterSpacing: typography.letterSpacing.wide,
    color: colors.text.dim,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.cardTitle,
    color: '#FFFFFF',
  },
  cardMain: {
    flex: 1,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  descriptionText: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  nameText: {
    color: colors.text.primary,
    fontWeight: typography.weight.cardTitle,
  },
  timeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  tripBadge: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tripBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
});
