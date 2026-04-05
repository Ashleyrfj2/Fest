/**
 * Food Planner Data Hook
 * Real-time data management for meals with ingredient sync to supply list
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MealDay,
  Meal,
  MealDayInsert,
  MealInsert,
  MealUpdate,
  groupMealsByDayAndSlot,
  normalizeIngredientName,
  deduplicateIngredients,
  MealsByDayAndSlot,
} from '@/lib/foodPlannerTypes';
import { useAuth } from '@/lib/auth/AuthContext';
import { Database } from '@/lib/database.types';

type SupplyItem = Database['public']['Tables']['supply_items']['Row'];

/**
 * Hook to fetch and subscribe to meals for a trip with ingredient sync
 */
export function useFoodPlanner(tripId: string) {
  const [mealDays, setMealDays] = useState<MealDay[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Fetch meal days with user info
  const fetchMealDays = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('meal_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setMealDays(data as MealDay[]);
    } catch (err) {
      console.error('Error fetching meal days:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal days');
    }
  }, [tripId]);

  // Fetch meals with cook user info
  const fetchMeals = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('meals')
        .select(`
          *,
          cookUser:users!meals_cook_id_fkey(id, display_name, avatar_color),
          meal_days(trip_id)
        `);

      if (fetchError) throw fetchError;

      // Filter meals by trip_id
      const filteredData = data?.filter(
        (meal: any) => meal.meal_days?.trip_id === tripId
      ) || [];

      setMeals(filteredData as Meal[]);
    } catch (err) {
      console.error('Error fetching meals:', err);
      // Don't override error message if we already have one from fetchMealDays
      if (!error) {
        setError(err instanceof Error ? err.message : 'Failed to load meals');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId, error]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchMealDays();
    fetchMeals();

    // Subscribe to meal_days changes
    const mealDaysChannel = supabase
      .channel(`meal_days:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_days',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchMealDays();
        }
      )
      .subscribe();

    // Subscribe to meals changes (join with meal_days to filter by trip)
    const mealsChannel = supabase
      .channel(`meals:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
        },
        (payload) => {
          fetchMeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mealDaysChannel);
      supabase.removeChannel(mealsChannel);
    };
  }, [tripId, fetchMealDays, fetchMeals]);

  // Create a new meal day if it doesn't exist
  const getOrCreateMealDay = useCallback(
    async (date: string): Promise<MealDay | null> => {
      try {
        // Check if meal day exists
        const existing = mealDays.find((d) => d.date === date);
        if (existing) {
          return existing;
        }

        // Create new meal day
        const { data, error: insertError } = await supabase
          .from('meal_days')
          .insert({
            trip_id: tripId,
            date,
            day_label: new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }),
          })
          .select('*')
          .single();

        if (insertError) throw insertError;

        // Optimistic update
        setMealDays((prev) => [...prev, data as MealDay].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }));

        return data as MealDay;
      } catch (err) {
        console.error('Error creating meal day:', err);
        return null;
      }
    },
    [tripId, mealDays]
  );

  // Sync ingredients to supply list (deduplicated, case-insensitive)
  const syncIngredientsToSupplyList = useCallback(
    async (ingredients: string[]): Promise<void> => {
      try {
        if (!ingredients.length) return;

        // Deduplicate ingredients
        const deduped = deduplicateIngredients(ingredients);

        // For each ingredient, check if it exists in supply list
        for (const ingredient of deduped) {
          const normalized = normalizeIngredientName(ingredient);

          // Check if ingredient already exists (case-insensitive)
          const { data: existing } = await supabase
            .from('supply_items')
            .select('id, name, quantity')
            .eq('trip_id', tripId)
            .then((result) => {
              // Manual case-insensitive search
              if (result.data) {
                const found = result.data.find(
                  (item) => normalizeIngredientName(item.name) === normalized
                );
                return { data: found, error: result.error };
              }
              return result;
            });

          if (existing) {
            // Update quantity (increment)
            await supabase
              .from('supply_items')
              .update({ quantity: existing.quantity + 1 })
              .eq('id', existing.id);
          } else {
            // Insert new supply item
            await supabase.from('supply_items').insert({
              trip_id: tripId,
              name: ingredient,
              quantity: 1,
              category: 'food',
              status: 'unassigned',
            });
          }
        }
      } catch (err) {
        console.error('Error syncing ingredients to supply list:', err);
      }
    },
    [tripId]
  );

  // Add or update meal
  const saveMeal = useCallback(
    async (
      mealDayId: string,
      slot: string,
      mealData: {
        name: string;
        ingredients: string[];
        cook_id?: string | null;
        dietary_flags: string[];
        notes?: string;
      }
    ): Promise<{ data: Meal | null; error: string | null }> => {
      try {
        // Check if meal already exists
        const existing = meals.find(
          (m) => m.meal_day_id === mealDayId && m.slot === slot
        );

        if (existing) {
          // Update existing meal
          const { data, error: updateError } = await supabase
            .from('meals')
            .update({
              name: mealData.name,
              ingredients: mealData.ingredients,
              cook_id: mealData.cook_id || null,
              dietary_flags: mealData.dietary_flags,
              notes: mealData.notes || null,
            })
            .eq('id', existing.id)
            .select(
              `
              *,
              cookUser:users!meals_cook_id_fkey(id, display_name, avatar_color)
            `
            )
            .single();

          if (updateError) throw updateError;

          // Optimistic update
          setMeals((prev) =>
            prev.map((m) => (m.id === existing.id ? (data as Meal) : m))
          );

          // Sync ingredients
          await syncIngredientsToSupplyList(mealData.ingredients);

          // Log activity
          await supabase.from('activity_logs').insert({
            trip_id: tripId,
            user_id: userProfile?.id,
            action_type: 'meal_updated',
            module: 'food_planner',
            target_id: existing.id,
            description: `Updated meal: ${mealData.name}`,
          });

          return { data: data as Meal, error: null };
        } else {
          // Create new meal
          const { data, error: insertError } = await supabase
            .from('meals')
            .insert({
              meal_day_id: mealDayId,
              slot,
              name: mealData.name,
              ingredients: mealData.ingredients,
              cook_id: mealData.cook_id || null,
              dietary_flags: mealData.dietary_flags,
              notes: mealData.notes || null,
            })
            .select(
              `
              *,
              cookUser:users!meals_cook_id_fkey(id, display_name, avatar_color)
            `
            )
            .single();

          if (insertError) throw insertError;

          // Optimistic update
          setMeals((prev) => [...prev, data as Meal]);

          // Sync ingredients
          await syncIngredientsToSupplyList(mealData.ingredients);

          // Log activity
          await supabase.from('activity_logs').insert({
            trip_id: tripId,
            user_id: userProfile?.id,
            action_type: 'meal_created',
            module: 'food_planner',
            target_id: data.id,
            description: `Added meal: ${mealData.name}`,
          });

          return { data: data as Meal, error: null };
        }
      } catch (err) {
        console.error('Error saving meal:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save meal',
        };
      }
    },
    [tripId, meals, userProfile?.id, syncIngredientsToSupplyList]
  );

  // Duplicate meal to another slot/day
  const duplicateMeal = useCallback(
    async (
      sourceMeal: Meal,
      targetDate: string,
      targetSlot: string
    ): Promise<{ data: Meal | null; error: string | null }> => {
      try {
        // Ensure target meal day exists
        const targetMealDay = await getOrCreateMealDay(targetDate);
        if (!targetMealDay) {
          throw new Error('Failed to create or find target meal day');
        }

        // Duplicate the meal
        return await saveMeal(targetMealDay.id, targetSlot, {
          name: sourceMeal.name,
          ingredients: [...(sourceMeal.ingredients ?? [])],
          cook_id: sourceMeal.cook_id,
          dietary_flags: [...(sourceMeal.dietary_flags ?? [])],
          notes: sourceMeal.notes || undefined,
        });
      } catch (err) {
        console.error('Error duplicating meal:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to duplicate meal',
        };
      }
    },
    [getOrCreateMealDay, saveMeal]
  );

  // Delete meal
  const deleteMeal = useCallback(
    async (mealId: string): Promise<{ error: string | null }> => {
      try {
        const { error: deleteError } = await supabase
          .from('meals')
          .delete()
          .eq('id', mealId);

        if (deleteError) throw deleteError;

        // Optimistic update
        setMeals((prev) => prev.filter((m) => m.id !== mealId));

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'meal_deleted',
          module: 'food_planner',
          target_id: mealId,
          description: 'Deleted meal',
        });

        return { error: null };
      } catch (err) {
        console.error('Error deleting meal:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete meal',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  // Get grouped meals
  const groupedMeals = groupMealsByDayAndSlot(mealDays, meals);

  return {
    mealDays,
    meals,
    groupedMeals,
    isLoading,
    error,
    saveMeal,
    deleteMeal,
    duplicateMeal,
    getOrCreateMealDay,
  };
}
