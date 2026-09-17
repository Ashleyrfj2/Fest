/**
 * Category Section
 * Collapsible section grouping supply items by category
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { CategoryGroup } from '@/lib/supplyTypes';
import { SupplyItemCard } from './SupplyItemCard';
import { SupplyItem } from '@/lib/supplyTypes';

interface CategorySectionProps {
  group: CategoryGroup;
  currentUserId?: string;
  onClaim: (itemId: string) => Promise<void>;
  onUnclaim: (itemId: string) => Promise<void>;
  onTogglePacked: (itemId: string) => Promise<void>;
  onEdit: (item: SupplyItem) => void;
  onDelete: (itemId: string) => Promise<void>;
  isEditor: boolean;
  defaultExpanded?: boolean;
}

export function CategorySection({
  group,
  currentUserId,
  onClaim,
  onUnclaim,
  onTogglePacked,
  onEdit,
  onDelete,
  isEditor,
  defaultExpanded = true,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const { category, items, progress } = group;

  return (
    <View style={styles.section}>
      {/* Category Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          <Text style={styles.categoryName}>{category.label}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Progress Indicator */}
          {progress.total > 0 && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {progress.packed}/{progress.total} packed
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress.percentPacked}%`,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown size={20} color={colors.text.mid} strokeWidth={2} />
          ) : (
            <ChevronRight size={20} color={colors.text.mid} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      {/* Items List */}
      {isExpanded && (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <SupplyItemCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              onClaim={onClaim}
              onUnclaim={onUnclaim}
              onTogglePacked={onTogglePacked}
              onEdit={onEdit}
              onDelete={onDelete}
              isEditor={isEditor}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressInfo: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  progressText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: colors.surface.level3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  itemsList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
