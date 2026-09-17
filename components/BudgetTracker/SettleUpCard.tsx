/**
 * SettleUpCard Component
 *
 * Displays settle-up summary showing:
 * - Total expenses
 * - Member balances (who paid what, who owes what)
 * - Recommended settlements (who should pay whom)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { MemberBalance, Settlement } from '@/lib/budgetTypes';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface SettleUpCardProps {
  totalExpensesCents: number;
  memberBalances: Map<string, MemberBalance>;
  settlements: Settlement[];
  members: Map<string, User>;
}

export function SettleUpCard({
  totalExpensesCents,
  memberBalances,
  settlements,
  members,
}: SettleUpCardProps) {
  const balancesArray = Array.from(memberBalances.values()).sort(
    (a, b) => Math.abs(b.net_balance_cents) - Math.abs(a.net_balance_cents)
  );

  function getBalanceColor(balanceCents: number) {
    if (balanceCents > 0) return colors.success; // owed money
    if (balanceCents < 0) return colors.danger; // owes money
    return colors.text.tertiary; // zero
  }

  function getBalanceLabel(balanceCents: number) {
    if (balanceCents > 0) return 'owed';
    if (balanceCents < 0) return 'owes';
    return 'settled';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settle Up</Text>

      {/* Total expenses */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalAmount}>
          ${(totalExpensesCents / 100).toFixed(2)}
        </Text>
      </View>

      {/* Member balances */}
      {balancesArray.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Member Balances</Text>
          <View style={styles.balancesList}>
            {balancesArray.map((balance) => {
              const user = members.get(balance.user_id);
              const balanceColor = getBalanceColor(balance.net_balance_cents);
              const balanceLabel = getBalanceLabel(balance.net_balance_cents);

              return (
                <View key={balance.user_id} style={styles.balanceRow}>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceName}>
                      {user?.display_name || 'Unknown'}
                    </Text>
                    <Text style={styles.balanceDetail}>
                      Paid: ${(balance.total_paid_cents / 100).toFixed(2)} •{' '}
                      Owes: ${(balance.total_owed_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.balanceAmount}>
                    <Text
                      style={[
                        styles.balanceValue,
                        { color: balanceColor },
                      ]}
                    >
                      {balanceLabel === 'settled'
                        ? 'Even'
                        : `${balanceLabel} $${Math.abs(balance.net_balance_cents / 100).toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recommended Payments</Text>
          <ScrollView style={styles.settlementsList} showsVerticalScrollIndicator={false}>
            {settlements.map((settlement, idx) => {
              const fromUser = members.get(settlement.from_user_id);
              const toUser = members.get(settlement.to_user_id);

              return (
                <View key={`${settlement.from_user_id}-${settlement.to_user_id}-${idx}`} style={styles.settlementRow}>
                  <Text style={styles.settlementFrom}>
                    {fromUser?.display_name || 'Unknown'}
                  </Text>
                  <View style={styles.settlementArrow}>
                    <ArrowRight size={16} color={colors.text.secondary} />
                  </View>
                  <Text style={styles.settlementTo}>
                    {toUser?.display_name || 'Unknown'}
                  </Text>
                  <Text style={styles.settlementAmount}>
                    ${(settlement.amount_cents / 100).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {settlements.length === 0 && totalExpensesCents > 0 && (
        <View style={styles.allSettledContainer}>
          <Text style={styles.allSettledText}>✓ Everyone is settled up!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  title: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  totalCard: {
    backgroundColor: colors.accent.gold + '20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.gold,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    ...typography.heading1,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  balancesList: {
    gap: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceName: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  balanceDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  balanceAmount: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    ...typography.label,
    marginLeft: spacing.md,
  },
  settlementsList: {
    maxHeight: 300,
    gap: spacing.md,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  settlementFrom: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
    flex: 0.3,
  },
  settlementArrow: {
    marginHorizontal: spacing.sm,
  },
  settlementTo: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    flex: 0.3,
  },
  settlementAmount: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'right',
    flex: 0.4,
  },
  allSettledContainer: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  allSettledText: {
    ...typography.label,
    color: colors.success,
    textAlign: 'center',
  },
});
