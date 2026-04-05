/**
 * Meal Editor Modal
 * Form to create/edit meals with ingredients, cook assignment, and dietary flags
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { X, Plus, Trash2, ChefHat } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import {
  Meal,
  DIETARY_FLAGS,
  DIETARY_FLAG_METADATA,
  getMealSlotMetadata,
} from '@/lib/foodPlannerTypes';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface MealEditorModalProps {
  visible: boolean;
  meal?: Meal | null;
  slot: string;
  date: string;
  dayLabel: string;
  groupMembers: User[];
  onSave: (mealData: {
    name: string;
    ingredients: string[];
    cook_id?: string | null;
    dietary_flags: string[];
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MealEditorModal({
  visible,
  meal,
  slot,
  date,
  dayLabel,
  groupMembers,
  onSave,
  onCancel,
}: MealEditorModalProps) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [cookId, setCookId] = useState<string | null>(null);
  const [dietaryFlags, setDietaryFlags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form from meal if editing
  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setIngredients(meal.ingredients ?? []);
      setCookId(meal.cook_id || null);
      setDietaryFlags(meal.dietary_flags ?? []);
      setNotes(meal.notes || '');
    } else {
      // Reset form for new meal
      setName('');
      setIngredients([]);
      setIngredientInput('');
      setCookId(null);
      setDietaryFlags([]);
      setNotes('');
    }
  }, [meal, visible]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing Meal Name', 'Please enter a meal name');
      return;
    }

    if (!ingredients.length) {
      Alert.alert('No Ingredients', 'Please add at least one ingredient');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        ingredients,
        cook_id: cookId,
        dietary_flags: dietaryFlags,
        notes: notes.trim() || undefined,
      });
      onCancel();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddIngredient() {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  }

  function handleRemoveIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function toggleDietaryFlag(flag: string) {
    setDietaryFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  }

  const slotMeta = getMealSlotMetadata(slot as any);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} disabled={isSaving}>
            <X size={24} color={colors.text.mid} strokeWidth={2} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {meal ? 'Edit Meal' : 'Add Meal'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {slotMeta.icon} {slotMeta.label} • {dayLabel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveButtonText,
                isSaving && styles.saveButtonTextDisabled,
              ]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Meal Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Campfire Pasta"
              placeholderTextColor={colors.text.dim}
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ingredients</Text>
            <View style={styles.ingredientInput}>
              <TextInput
                style={[styles.input, styles.ingredientInputField]}
                placeholder="Add ingredient..."
                placeholderTextColor={colors.text.dim}
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={handleAddIngredient}
                editable={!isSaving}
              />
              <TouchableOpacity
                onPress={handleAddIngredient}
                disabled={!ingredientInput.trim() || isSaving}
                style={styles.addButton}
              >
                <Plus size={20} color={colors.accent.gold} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(index)}
                      disabled={isSaving}
                    >
                      <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Cook Assignment */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cook Assignment</Text>
            <View style={styles.cookSelect}>
              {groupMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => setCookId(cookId === member.id ? null : member.id)}
                  disabled={isSaving}
                  style={[
                    styles.cookOption,
                    cookId === member.id && styles.cookOptionSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.cookAvatar,
                      { backgroundColor: member.avatar_color },
                    ]}
                  >
                    <Text
                      style={styles.cookInitial}
                      numberOfLines={1}
                    >
                      {member.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cookName,
                      cookId === member.id && styles.cookNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {member.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dietary Flags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dietary Flags</Text>
            <View style={styles.dietaryFlagsGrid}>
              {DIETARY_FLAGS.map((flag) => {
                const meta = DIETARY_FLAG_METADATA[flag];
                return (
                  <TouchableOpacity
                    key={flag}
                    onPress={() => toggleDietaryFlag(flag)}
                    disabled={isSaving}
                    style={[
                      styles.dietaryOption,
                      dietaryFlags.includes(flag) &&
                        styles.dietaryOptionSelected,
                    ]}
                  >
                    <Text style={styles.dietaryOptionIcon}>{meta.icon}</Text>
                    <Text
                      style={[
                        styles.dietaryOptionLabel,
                        dietaryFlags.includes(flag) &&
                          styles.dietaryOptionLabelSelected,
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add any special notes or prep instructions..."
              placeholderTextColor={colors.text.dim}
              value={notes}
              onChangeText={setNotes}
              multiline
              editable={!isSaving}
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.level1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingTop: spacing.lg,
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.body,
  },
  ingredientInput: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  ingredientInputField: {
    flex: 1,
  },
  addButton: {
    padding: spacing.md,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  ingredientsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
  },
  ingredientText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
    flex: 1,
  },
  cookSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cookOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.level2,
  },
  cookOptionSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.surface.level3,
  },
  cookAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cookInitial: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.headline,
    color: colors.base,
  },
  cookName: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  cookNameSelected: {
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  dietaryFlagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dietaryOption: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.level2,
  },
  dietaryOptionSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.surface.level3,
  },
  dietaryOptionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  dietaryOptionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dietaryOptionLabelSelected: {
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  spacer: {
    height: spacing.xl,
  },
});
