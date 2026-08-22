/**
 * Supply Item Card
 * Displays a single supply item with status, claimed user, and actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, Circle, MoreVertical, Trash2, Edit } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { SupplyItem, getCategoryMetadata } from '@/lib/supplyTypes';

interface SupplyItemCardProps {
  item: SupplyItem;
  currentUserId?: string;
  onClaim: (itemId: string) => Promise<void>;
  onUnclaim: (itemId: string) => Promise<void>;
  onTogglePacked: (itemId: string) => Promise<void>;
  onEdit: (item: SupplyItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  isEditor: boolean;
}

export function SupplyItemCard({
  item,
  currentUserId,
  onClaim,
  onUnclaim,
  onTogglePacked,
  onEdit,
  onDelete,
  isEditor,
}: SupplyItemCardProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const categoryMeta = getCategoryMetadata(item.category);
  const isClaimed = item.status === 'claimed' || item.status === 'packed';
  const isPacked = item.status === 'packed';
  const isClaimedByMe = item.claimed_by === currentUserId;
  const canClaim = !isClaimed;
  const canUnclaim = isClaimedByMe;
  const canTogglePacked = isClaimedByMe && isClaimed;

  async function handleClaim() {
    setIsActionLoading(true);
    try {
      await onClaim(item.id);
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleUnclaim() {
    setIsActionLoading(true);
    try {
      await onUnclaim(item.id);
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleTogglePacked() {
    setIsActionLoading(true);
    try {
      await onTogglePacked(item.id);
    } finally {
      setIsActionLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setShowMenu(false);
            await onDelete(item.id);
          },
        },
      ]
    );
  }

  return (
    <View
      testID={`supply-item-${item.id}`}
      style={[styles.card, isPacked && styles.cardPacked]}
    >
      {/* Left: Pack Status Toggle */}
      {canTogglePacked && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isPacked ? `Mark ${item.name} unpacked` : `Mark ${item.name} packed`}
          style={styles.packToggle}
          onPress={handleTogglePacked}
          disabled={isActionLoading}
          activeOpacity={0.7}
        >
          {isActionLoading ? (
            <ActivityIndicator size="small" color={colors.success} />
          ) : isPacked ? (
            <CheckCircle size={24} color={colors.success} fill={colors.success} />
          ) : (
            <Circle size={24} color={colors.text.dim} strokeWidth={2} />
          )}
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Item Name and Quantity */}
        <View style={styles.header}>
          <Text style={[styles.itemName, isPacked && styles.itemNamePacked]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>×{item.quantity}</Text>
            </View>
          )}
        </View>

        {/* Category Badge and Status */}
        <View style={styles.meta}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryMeta.color}20` }]}>
            <Text style={styles.categoryIcon}>{categoryMeta.icon}</Text>
            <Text style={[styles.categoryText, { color: categoryMeta.color }]}>
              {categoryMeta.label}
            </Text>
          </View>

          {/* Claimed By */}
          {isClaimed && item.claimedByUser && (
            <View style={styles.claimedBy}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: item.claimedByUser.avatar_color },
                ]}
              >
                <Text style={styles.avatarText}>
                  {item.claimedByUser.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.claimedByText} numberOfLines={1}>
                {isClaimedByMe ? 'You' : item.claimedByUser.display_name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: Actions */}
      <View style={styles.actions}>
        {/* Claim/Unclaim Button */}
        {canClaim && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaim}
            disabled={isActionLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}

        {canUnclaim && !isPacked && (
          <TouchableOpacity
            style={styles.unclaimButton}
            onPress={handleUnclaim}
            disabled={isActionLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.unclaimButtonText}>Unclaim</Text>
          </TouchableOpacity>
        )}

        {/* Menu Button (Edit/Delete) */}
        {isEditor && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Open actions for ${item.name}`}
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color={colors.text.mid} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Menu */}
      {showMenu && isEditor && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onEdit(item);
            }}
            activeOpacity={0.7}
          >
            <Edit size={16} color={colors.text.primary} strokeWidth={2} />
            <Text style={styles.menuItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    position: 'relative',
  },
  cardPacked: {
    opacity: 0.6,
  },
  packToggle: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    flex: 1,
  },
  itemNamePacked: {
    textDecorationLine: 'line-through',
    color: colors.text.dim,
  },
  quantityBadge: {
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  quantityText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
  },
  claimedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 150,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: typography.weight.label,
    color: colors.base,
  },
  claimedByText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  claimButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  claimButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.base,
  },
  unclaimButton: {
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  unclaimButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  menuButton: {
    padding: spacing.xs,
  },
  menu: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
});
