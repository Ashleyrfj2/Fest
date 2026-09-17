/**
 * Meal Card Component
 * Displays a single meal with dietary flags, cook assignment, and actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  MoreVertical,
  Copy,
  Trash2,
  ChefHat,
  Vegan,
  WheatOff,
  NutOff,
  MilkOff,
  CircleSlash,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { Meal, DIETARY_FLAG_METADATA, DietaryFlag } from '@/lib/foodPlannerTypes';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface MealCardProps {
  meal: Meal;
  slot: string;
  date: string;
  dayLabel: string;
  cook?: User | null;
  isEditor: boolean;
  onEdit: (meal: Meal) => void;
  onDuplicate: () => void;
  onDelete: () => Promise<void>;
}

const DIETARY_FLAG_ICONS: Record<DietaryFlag, LucideIcon> = {
  vegan: Vegan,
  gluten_free: WheatOff,
  nut_free: NutOff,
  dairy_free: MilkOff,
  other: CircleSlash,
};

export function MealCard({
  meal,
  slot,
  date,
  dayLabel,
  cook,
  isEditor,
  onEdit,
  onDuplicate,
  onDelete,
}: MealCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dietaryFlags = meal.dietary_flags ?? [];
  const ingredients = meal.ingredients ?? [];

  function handleDelete() {
    Alert.alert('Delete Meal', `Delete "${meal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setShowMenu(false);
          setIsDeleting(true);
          try {
            await onDelete();
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      {/* Meal Name and Actions */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.mealName}>{meal.name}</Text>
          {dietaryFlags.length > 0 && (
            <View style={styles.dietaryFlags}>
              {dietaryFlags.slice(0, 2).map((flag) => {
                const dietaryFlag = flag as DietaryFlag;
                const meta = DIETARY_FLAG_METADATA[dietaryFlag];
                if (!meta) {
                  return null;
                }
                const DietaryIcon = DIETARY_FLAG_ICONS[dietaryFlag] ?? CircleSlash;

                return (
                  <View
                    key={flag}
                    style={[styles.dietaryBadge, { backgroundColor: meta.color }]}
                  >
                    <DietaryIcon size={12} color={colors.base} strokeWidth={2.1} />
                  </View>
                );
              })}
              {dietaryFlags.length > 2 && (
                <View style={styles.dietaryBadge}>
                  <Text style={styles.dietaryText}>+{dietaryFlags.length - 2}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {isEditor && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} color={colors.text.mid} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cook Assignment */}
      {cook && (
        <View style={styles.cook}>
          <ChefHat size={14} color={colors.accent.gold} strokeWidth={2} />
          <Text style={styles.cookText}>{cook.display_name}</Text>
        </View>
      )}

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <View style={styles.ingredients}>
          <Text style={styles.ingredientsLabel}>Ingredients:</Text>
          <View style={styles.ingredientsList}>
            {ingredients.slice(0, 3).map((ingredient, idx) => (
              <Text key={idx} style={styles.ingredient}>
                • {ingredient}
              </Text>
            ))}
            {ingredients.length > 3 && (
              <Text style={styles.ingredient}>
                • +{ingredients.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Notes */}
      {meal.notes && <Text style={styles.notes}>{meal.notes}</Text>}

      {/* Action Menu */}
      {showMenu && isEditor && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onEdit(meal);
            }}
          >
            <Text style={styles.menuItemText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onDuplicate();
            }}
          >
            <Copy size={16} color={colors.accent.gold} strokeWidth={2} style={{ marginRight: spacing.xs }} />
            <Text style={styles.menuItemText}>Clone to Another Day</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} color={colors.danger} strokeWidth={2} style={{ marginRight: spacing.xs }} />
            <Text style={styles.menuItemDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nameContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  mealName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  dietaryFlags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dietaryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dietaryText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  cook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  cookText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  ingredients: {
    marginBottom: spacing.sm,
  },
  ingredientsLabel: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.xs,
  },
  ingredientsList: {
    gap: spacing.xs,
  },
  ingredient: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  notes: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  menu: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  menuItemDanger: {
    backgroundColor: colors.surface.level3,
  },
  menuItemDangerText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.danger,
  },
});
