/**
 * Food Planner Screen
 * Day-by-day meal planner with ingredient sync to supply list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, UtensilsCrossed } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { useAuth } from '@/lib/auth/AuthContext';
import { useFoodPlanner } from '@/lib/hooks/useFoodPlanner';
import { supabase } from '@/lib/supabase';
import { Meal, MEAL_SLOTS, getMealSlotMetadata } from '@/lib/foodPlannerTypes';
import { Database } from '@/lib/database.types';
import { MealCard } from '@/components/FoodPlanner/MealCard';
import { MealEditorModal } from '@/components/FoodPlanner/MealEditorModal';

type User = Database['public']['Tables']['users']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];

export default function FoodPlannerScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingSlot, setEditingSlot] = useState<string>('');
  const [editingDate, setEditingDate] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [duplicatingMealId, setDuplicatingMealId] = useState<string | null>(null);

  // Load food planner data
  const {
    mealDays,
    meals,
    groupedMeals,
    isLoading,
    error,
    saveMeal,
    deleteMeal,
    duplicateMeal,
  } = useFoodPlanner(tripId);

  // Load user role and group members
  React.useEffect(() => {
    loadUserRoleAndMembers();
  }, [tripId, userProfile?.id]);

  async function loadUserRoleAndMembers() {
    if (!userProfile?.id || !tripId) return;

    try {
      // Get user role
      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('trip_id', tripId)
        .eq('user_id', userProfile.id)
        .single();

      setCurrentRole(memberData?.role || null);

      // Get all group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, user:users(*)')
        .eq('trip_id', tripId);

      if (members) {
        const users = members.map((m: any) => m.user).filter(Boolean);
        setGroupMembers(users);
      }
    } catch (error) {
      console.error('Error loading user role and members:', error);
    }
  }

  const isEditor = currentRole === 'leader' || currentRole === 'editor';

  function handleOpenAddMeal(date: string, slot: string) {
    setEditingMeal(null);
    setEditingDate(date);
    setEditingSlot(slot);
    setIsModalVisible(true);
  }

  function handleOpenEditMeal(meal: Meal) {
    setEditingMeal(meal);
    const mealDay = mealDays.find((d) => d.id === meal.meal_day_id);
    if (mealDay) {
      setEditingDate(mealDay.date);
      setEditingSlot(meal.slot);
    }
    setIsModalVisible(true);
  }

  async function handleSaveMeal(mealData: any) {
    const result = await saveMeal(
      mealDays.find((d) => d.date === editingDate)?.id ||
        (await supabase
          .from('meal_days')
          .insert({ trip_id: tripId, date: editingDate })
          .select()
          .single()
          .then((r) => r.data?.id || '')),
      editingSlot,
      mealData
    );

    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleDeleteMeal(mealId: string) {
    const result = await deleteMeal(mealId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleDuplicateMeal(sourceMeal: Meal, targetDate: string, targetSlot: string) {
    const result = await duplicateMeal(sourceMeal, targetDate, targetSlot);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Meal cloned successfully');
      setDuplicatingMealId(null);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading meal planner...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load meal planner</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </SafeAreaView>
    );
  }

  const isEmpty = mealDays.length === 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (tripId) {
              router.replace({ pathname: '/trips/[id]', params: { id: tripId } });
              return;
            }
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Food Planner</Text>
          <Text style={styles.headerSubtitle}>
            {mealDays.length} days planned
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Empty State */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <UtensilsCrossed size={48} color={colors.text.disabled} strokeWidth={1.5} />
          <Text style={styles.emptyLabel}>No Meals Planned Yet</Text>
          <Text style={styles.emptyDescription}>
            Start planning your festival meals by adding ingredients and assigning cooks.
          </Text>
          {isEditor && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => handleOpenAddMeal(new Date().toISOString().split('T')[0], 'breakfast')}
            >
              <Plus size={18} color={colors.base} strokeWidth={2} />
              <Text style={styles.emptyButtonText}>Add First Meal</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Meals by day */}
          {mealDays.map((mealDay) => (
            <View key={mealDay.date} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{mealDay.day_label}</Text>
                <Text style={styles.dayDate}>{mealDay.date}</Text>
              </View>

              {/* Meal slots */}
              {MEAL_SLOTS.map((slot) => {
                const meal = groupedMeals[mealDay.date]?.meals[slot];
                const slotMeta = getMealSlotMetadata(slot);
                const cook = meal && groupMembers.find((u) => u.id === meal.cook_id);

                return (
                  <View key={slot} style={styles.slotContainer}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotLabel}>
                        {slotMeta.icon} {slotMeta.label}
                      </Text>
                      <Text style={styles.slotTime}>{slotMeta.time}</Text>
                    </View>

                    {meal ? (
                      <MealCard
                        meal={meal}
                        slot={slot}
                        date={mealDay.date}
                        dayLabel={mealDay.day_label || mealDay.date}
                        cook={cook}
                        isEditor={isEditor}
                        onEdit={handleOpenEditMeal}
                        onDuplicate={() => setDuplicatingMealId(meal.id)}
                        onDelete={() => handleDeleteMeal(meal.id)}
                      />
                    ) : (
                      isEditor && (
                        <TouchableOpacity
                          style={styles.emptySlot}
                          onPress={() => handleOpenAddMeal(mealDay.date, slot)}
                        >
                          <Plus size={20} color={colors.text.disabled} strokeWidth={2} />
                          <Text style={styles.emptySlotText}>Add meal</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.spacer} />
        </ScrollView>
      )}

      {/* Meal Editor Modal */}
      {editingDate && editingSlot && (
        <MealEditorModal
          visible={isModalVisible}
          meal={editingMeal}
          slot={editingSlot}
          date={editingDate}
          dayLabel={
            mealDays.find((d) => d.date === editingDate)?.day_label ||
            editingDate
          }
          groupMembers={groupMembers}
          onSave={handleSaveMeal}
          onCancel={() => setIsModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.level1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  daySection: {
    marginBottom: spacing.xl,
  },
  dayHeader: {
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  dayDate: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginTop: spacing.xs,
  },
  slotContainer: {
    marginBottom: spacing.lg,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  slotTime: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  emptySlot: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptySlotText: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyLabel: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.gold,
  },
  emptyButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.base,
  },
  spacer: {
    height: spacing.xl,
  },
});
