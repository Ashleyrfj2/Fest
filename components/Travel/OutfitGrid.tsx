/**
 * Outfit Grid Component
 * Displays outfit posts with voting
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Shirt, ThumbsUp, ThumbsDown, Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { OutfitPost, VoteType } from '@/lib/travelTypes';

interface OutfitGridProps {
  outfitPosts: OutfitPost[];
  currentUserId?: string;
  onVote: (postId: string, vote: VoteType) => void;
  onRemoveVote: (postId: string) => void;
  onAddPost: () => void;
  isEditor: boolean;
}

export function OutfitGrid({
  outfitPosts,
  currentUserId,
  onVote,
  onRemoveVote,
  onAddPost,
  isEditor,
}: OutfitGridProps) {
  function handleVote(postId: string, vote: VoteType, currentVote: VoteType | null) {
    if (currentVote === vote) {
      // Remove vote if clicking same button
      onRemoveVote(postId);
    } else {
      // Add or change vote
      onVote(postId, vote);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shirt size={20} color={colors.accent.gold} strokeWidth={2} />
          <Text style={styles.headerTitle}>Outfit Voting</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPost}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.base} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Posts */}
      {outfitPosts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {outfitPosts.map((post) => (
            <OutfitCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onVote={handleVote}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No outfits posted yet</Text>
          <Text style={styles.emptyHint}>
            Share your festival outfit and vote on favorites
          </Text>
        </View>
      )}
    </View>
  );
}

interface OutfitCardProps {
  post: OutfitPost;
  currentUserId?: string;
  onVote: (postId: string, vote: VoteType, currentVote: VoteType | null) => void;
}

function OutfitCard({ post, currentUserId, onVote }: OutfitCardProps) {
  const userVote = post.vote_summary?.user_vote || null;
  const upvotes = post.vote_summary?.upvotes || 0;
  const downvotes = post.vote_summary?.downvotes || 0;

  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: post.photo_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View
          style={[
            styles.userBadge,
            { backgroundColor: post.user?.avatar_color || colors.surface.level2 },
          ]}
        >
          <Text style={styles.userBadgeText}>
            {(post.user?.display_name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {post.user?.display_name || 'User'}
        </Text>
        {post.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        )}
      </View>

      {/* Voting */}
      <View style={styles.voting}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            userVote === 'up' && styles.voteButtonActive,
          ]}
          onPress={() => onVote(post.id, 'up', userVote)}
          activeOpacity={0.7}
        >
          <ThumbsUp
            size={16}
            color={userVote === 'up' ? colors.base : colors.text.mid}
            strokeWidth={2}
            fill={userVote === 'up' ? colors.base : 'none'}
          />
          <Text
            style={[
              styles.voteCount,
              userVote === 'up' && styles.voteCountActive,
            ]}
          >
            {upvotes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            userVote === 'down' && styles.voteButtonActive,
          ]}
          onPress={() => onVote(post.id, 'down', userVote)}
          activeOpacity={0.7}
        >
          <ThumbsDown
            size={16}
            color={userVote === 'down' ? colors.base : colors.text.mid}
            strokeWidth={2}
            fill={userVote === 'down' ? colors.base : 'none'}
          />
          <Text
            style={[
              styles.voteCount,
              userVote === 'down' && styles.voteCountActive,
            ]}
          >
            {downvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 200,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surface.level3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  userBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  userBadgeText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  userName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  caption: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    lineHeight: typography.lineHeight.normal * typography.size.meta,
  },
  voting: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level3,
  },
  voteButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  voteCount: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.mid,
  },
  voteCountActive: {
    color: colors.base,
  },
  emptyState: {
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  emptyHint: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
