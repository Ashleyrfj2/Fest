/**
 * Food Planner Type Definitions
 * Types and constants for the collaborative meal planning module
 */

import { Database } from './database.types';

// Database types
export type MealDayRow = Database['public']['Tables']['meal_days']['Row'];
export type MealDayInsert = Database['public']['Tables']['meal_days']['Insert'];
export type MealDayUpdate = Database['public']['Tables']['meal_days']['Update'];

export type MealRow = Database['public']['Tables']['meals']['Row'];
export type MealInsert = Database['public']['Tables']['meals']['Insert'];
export type MealUpdate = Database['public']['Tables']['meals']['Update'];

// Extended types with user info
export type MealDay = MealDayRow;

export type Meal = MealRow & {
  cookUser?: {
    id: string;
    display_name: string;
    avatar_color: string;
  } | null;
};

// Meal slot types (breakfast, lunch, dinner, snacks)
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export interface MealSlotMetadata {
  slot: MealSlot;
  label: string;
  icon: string;
  time: string;
}

export const MEAL_SLOT_METADATA: Record<MealSlot, MealSlotMetadata> = {
  breakfast: {
    slot: 'breakfast',
    label: 'Breakfast',
    icon: '🌅',
    time: '7-9 AM',
  },
  lunch: {
    slot: 'lunch',
    label: 'Lunch',
    icon: '🌞',
    time: '12-1 PM',
  },
  dinner: {
    slot: 'dinner',
    label: 'Dinner',
    icon: '🌙',
    time: '6-8 PM',
  },
  snacks: {
    slot: 'snacks',
    label: 'Snacks',
    icon: '🍿',
    time: 'Anytime',
  },
};

// Dietary flags
export type DietaryFlag = 'vegan' | 'gluten_free' | 'nut_free' | 'dairy_free' | 'other';

export const DIETARY_FLAGS: DietaryFlag[] = ['vegan', 'gluten_free', 'nut_free', 'dairy_free', 'other'];

export interface DietaryFlagMetadata {
  id: DietaryFlag;
  label: string;
  icon: string;
  color: string;
}

export const DIETARY_FLAG_METADATA: Record<DietaryFlag, DietaryFlagMetadata> = {
  vegan: {
    id: 'vegan',
    label: 'Vegan',
    icon: '🌱',
    color: '#28C896',
  },
  gluten_free: {
    id: 'gluten_free',
    label: 'Gluten-Free',
    icon: '🚫',
    color: '#FFB84D',
  },
  nut_free: {
    id: 'nut_free',
    label: 'Nut-Free',
    icon: '🥜',
    color: '#FF9999',
  },
  dairy_free: {
    id: 'dairy_free',
    label: 'Dairy-Free',
    icon: '🥛',
    color: '#A8B8FF',
  },
  other: {
    id: 'other',
    label: 'Other',
    icon: '⚠️',
    color: '#C9A84C',
  },
};

// Helper to get meal slot metadata
export function getMealSlotMetadata(slot: MealSlot): MealSlotMetadata {
  return MEAL_SLOT_METADATA[slot];
}

// Helper to get dietary flag metadata
export function getDietaryFlagMetadata(flag: DietaryFlag): DietaryFlagMetadata {
  return DIETARY_FLAG_METADATA[flag];
}

// Group meals by day and slot
export interface MealsByDayAndSlot {
  [date: string]: {
    dayLabel: string;
    meals: {
      [slot in MealSlot]?: Meal;
    };
  };
}

export function groupMealsByDayAndSlot(
  mealDays: MealDay[],
  meals: Meal[]
): MealsByDayAndSlot {
  const grouped: MealsByDayAndSlot = {};

  mealDays.forEach((day) => {
    grouped[day.date] = {
      dayLabel: day.day_label || day.date,
      meals: {},
    };
  });

  meals.forEach((meal) => {
    // Find the corresponding meal day
    const mealDay = mealDays.find((d) => d.id === meal.meal_day_id);
    if (mealDay && grouped[mealDay.date]) {
      grouped[mealDay.date].meals[meal.slot as MealSlot] = meal;
    }
  });

  return grouped;
}

// Ingredient sync helpers
export function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

export function deduplicateIngredients(ingredients: string[]): string[] {
  const normalized = new Map<string, string>();

  ingredients.forEach((ingredient) => {
    const normalized_key = normalizeIngredientName(ingredient);
    // Keep the first original casing
    if (!normalized.has(normalized_key)) {
      normalized.set(normalized_key, ingredient);
    }
  });

  return Array.from(normalized.values());
}
