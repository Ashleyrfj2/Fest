/**
 * Budget Tracker Screen
 *
 * Shared expense ledger for the trip.
 * - View all expenses
 * - Add/edit expenses with splits
 * - See settle-up summary
 * - Role-based access (editors can add/delete, viewers read-only)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { Database } from '@/lib/database.types';
import { useBudgetTracker } from '@/lib/hooks/useBudgetTracker';
import {
  BudgetEntryList,
  AddExpenseModal,
  SettleUpCard,
} from '@/components/BudgetTracker';

type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
};
type Trip = Database['public']['Tables']['trips']['Row'];
type BudgetEntry = Database['public']['Tables']['budget_entries']['Row'];

export default function BudgetTrackerScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { userProfile } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isTripLoading, setIsTripLoading] = useState(true);
  const [tripError, setTripError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const {
    entries,
    isLoading: isBudgetLoading,
    error: budgetError,
    addExpense,
    deleteExpense,
    getSummary,
  } = useBudgetTracker(tripId || '', userProfile?.id || '');

  useEffect(() => {
    if (!tripId || !userProfile) return;
    loadTripData();
  }, [tripId, userProfile]);

  async function loadTripData() {
    try {
      setIsTripLoading(true);
      setTripError(null);

      // Load trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Load members with users
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*, user:users(*)')
        .eq('trip_id', tripId);

      if (membersError) throw membersError;
      setMembers(membersData as any);

      // Get current user's role
      const currentMember = (membersData as any).find(
        (m: any) => m.user_id === userProfile?.id
      );
      setUserRole(currentMember?.role || 'viewer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load trip';
      setTripError(message);
      console.error('Error loading trip data:', error);
    } finally {
      setIsTripLoading(false);
    }
  }

  async function handleAddExpense(
    description: string,
    amountCents: number,
    category: string,
    splitWith: string[],
    splitType: 'equal' | 'custom',
    customSplits?: Record<string, number>
  ) {
    try {
      await addExpense(
        description,
        amountCents,
        category,
        splitWith,
        splitType,
        customSplits
      );
      Alert.alert('Success', 'Expense added!');
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async function handleDeleteExpense(entryId: string) {
    try {
      await deleteExpense(entryId);
      Alert.alert('Success', 'Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  const canEdit = userRole === 'leader' || userRole === 'editor';

  // Build members map for display
  const membersMap = new Map(members.map((m) => [m.user_id, m.user]));
  const memberIds = members.map((m) => m.user_id);

  // Get summary
  const summary = getSummary(memberIds);

  if (isTripLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tripError) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{tripError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorMessage}>Unable to load this trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Budget Tracker</Text>
          <Text style={styles.headerSubtitle}>{trip.name}</Text>
        </View>
        {canEdit && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {budgetError && (
        <View style={styles.alertContainer}>
          <Text style={styles.alertText}>⚠️ {budgetError}</Text>
        </View>
      )}

      {/* Settle-up summary */}
      {!isBudgetLoading && entries.length > 0 && (
        <SettleUpCard
          totalExpensesCents={summary.total_expenses_cents}
          memberBalances={summary.member_balances}
          settlements={summary.settlements}
          members={membersMap}
        />
      )}

      {/* Expense list */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Expenses {entries.length > 0 && `(${entries.length})`}
        </Text>
        <BudgetEntryList
          entries={entries}
          members={membersMap}
          isLoading={isBudgetLoading}
          canEdit={canEdit}
          onDelete={handleDeleteExpense}
        />
      </View>

      {/* Add expense modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddExpense}
        members={members}
        currentUserId={userProfile?.id || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContainer: {
    backgroundColor: colors.danger + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  alertText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.heading2,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
