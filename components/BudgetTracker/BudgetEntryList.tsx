/**
 * BudgetEntryList Component
 *
 * Displays a scrollable list of expense entries with payer, amount,
 * category, date, and action buttons.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trash2, Receipt } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { BudgetEntry } from '@/lib/budgetTypes';

interface BudgetEntryListProps {
  entries: BudgetEntry[];
  members: Map<string, { display_name: string; avatar_color: string }>;
  isLoading: boolean;
  canEdit: boolean;
  onDelete: (entryId: string) => Promise<void>;
  onEdit?: (entry: BudgetEntry) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: '🍽️ Food',
  supplies: '🛒 Supplies',
  fuel: '⛽ Fuel',
  activity: '🎪 Activity',
  misc: '📦 Misc',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FEE2E2',
  supplies: '#DBEAFE',
  fuel: '#FEF3C7',
  activity: '#FCE7F3',
  misc: '#F3E8FF',
};

export function BudgetEntryList({
  entries,
  members,
  isLoading,
  canEdit,
  onDelete,
  onEdit,
}: BudgetEntryListProps) {
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  async function handleDelete(entryId: string, description: string) {
    Alert.alert('Delete Expense', `Remove "${description}"?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await onDelete(entryId);
          } catch (err) {
            Alert.alert('Error', `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        },
        style: 'destructive',
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No expenses yet</Text>
        <Text style={styles.emptySubtitle}>
          When someone adds a shared expense, it will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {entries.map((entry) => {
        const payer = members.get(entry.paid_by);
        const categoryLabel = CATEGORY_LABELS[entry.category] || entry.category;
        const categoryBg = CATEGORY_COLORS[entry.category] || '#F3F4F6';

        return (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={styles.entryInfo}>
                <Text style={styles.description}>{entry.description}</Text>
                <Text style={styles.payer}>
                  Paid by {payer?.display_name || 'Unknown'}
                </Text>
              </View>
              <Text style={styles.amount}>${(entry.amount_cents / 100).toFixed(2)}</Text>
            </View>

            <View style={styles.entryFooter}>
              <View style={[styles.categoryTag, { backgroundColor: categoryBg }]}>
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
              <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
              {entry.receipt_url && (
                <View style={styles.receiptBadge}>
                  <Receipt size={14} color={colors.success} />
                </View>
              )}
            </View>

            {canEdit && (
              <View style={styles.actions}>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEdit(entry)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(entry.id, entry.description)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  entryCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  description: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  payer: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  amount: {
    ...typography.heading2,
    color: colors.primary,
    marginLeft: spacing.md,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  date: {
    ...typography.caption,
    color: colors.text.tertiary,
    flex: 1,
  },
  receiptBadge: {
    padding: spacing.xs,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.sm,
  },
  editButtonText: {
    ...typography.caption,
    color: colors.background.primary,
  },
  deleteButton: {
    padding: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.sm,
  },
});
