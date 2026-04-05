/**
 * AddExpenseModal Component
 *
 * Modal form for creating or editing an expense entry.
 * Includes:
 * - Description, amount, category input
 * - Split type toggle (equal/custom)
 * - Participant selection
 * - Custom split input (if selected)
 * - Receipt photo input (optional)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/tokens';
import { BudgetEntry } from '@/lib/budgetTypes';
import { Database } from '@/lib/database.types';

type GroupMember = Database['public']['Tables']['group_members']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
};

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    description: string,
    amountCents: number,
    category: string,
    splitWith: string[],
    splitType: 'equal' | 'custom',
    customSplits?: Record<string, number>,
    receiptUrl?: string
  ) => Promise<void>;
  editingEntry?: BudgetEntry | null;
  members: GroupMember[];
  currentUserId: string;
}

type CategoryOption = 'food' | 'supplies' | 'fuel' | 'activity' | 'misc';

const CATEGORIES: { value: CategoryOption; label: string }[] = [
  { value: 'food', label: '🍽️ Food' },
  { value: 'supplies', label: '🛒 Supplies' },
  { value: 'fuel', label: '⛽ Fuel' },
  { value: 'activity', label: '🎪 Activity' },
  { value: 'misc', label: '📦 Misc' },
];

export function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  members,
  currentUserId,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<CategoryOption>('food');
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id))
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setDescription(editingEntry.description);
      setAmountStr((editingEntry.amount_cents / 100).toFixed(2));
      setCategory(editingEntry.category as CategoryOption);
      setIsCustomSplit(editingEntry.split_type === 'custom');
      setSelectedMembers(new Set(editingEntry.split_with || []));

      if (editingEntry.custom_splits) {
        const splits: Record<string, string> = {};
        Object.entries(editingEntry.custom_splits).forEach(([userId, cents]) => {
          splits[userId] = ((cents as number) / 100).toFixed(2);
        });
        setCustomSplits(splits);
      }
    } else {
      resetForm();
    }
  }, [isOpen, editingEntry]);

  function resetForm() {
    setDescription('');
    setAmountStr('');
    setCategory('food');
    setIsCustomSplit(false);
    setSelectedMembers(new Set(members.map((m) => m.user_id)));
    setCustomSplits({});
  }

  function toggleMemberSelection(userId: string) {
    const updated = new Set(selectedMembers);
    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }
    setSelectedMembers(updated);
  }

  function updateCustomSplit(userId: string, amountStr: string) {
    const updated = { ...customSplits };
    if (amountStr.trim() === '') {
      delete updated[userId];
    } else {
      updated[userId] = amountStr;
    }
    setCustomSplits(updated);
  }

  async function handleSave() {
    // Validate inputs
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    const amountCents = Math.round(parseFloat(amountStr) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (selectedMembers.size === 0) {
      Alert.alert('Error', 'Select at least one participant');
      return;
    }

    if (isCustomSplit) {
      const customSplitsCents: Record<string, number> = {};
      let totalCents = 0;

      for (const [userId, amountStr] of Object.entries(customSplits)) {
        const cents = Math.round(parseFloat(amountStr) * 100);
        if (isNaN(cents) || cents < 0) {
          Alert.alert('Error', `Invalid amount for ${members.find((m) => m.user_id === userId)?.user.display_name}`);
          return;
        }
        customSplitsCents[userId] = cents;
        totalCents += cents;
      }

      if (totalCents !== amountCents) {
        Alert.alert(
          'Error',
          `Custom split total ($${(totalCents / 100).toFixed(2)}) does not match expense amount ($${(amountCents / 100).toFixed(2)})`
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const customSplitsCents = isCustomSplit
        ? Object.fromEntries(
            Object.entries(customSplits).map(([userId, amountStr]) => [
              userId,
              Math.round(parseFloat(amountStr) * 100),
            ])
          )
        : undefined;

      await onSave(
        description.trim(),
        amountCents,
        category,
        Array.from(selectedMembers),
        isCustomSplit ? 'custom' : 'equal',
        customSplitsCents
      );

      resetForm();
      onClose();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingEntry ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What was this for?"
              placeholderTextColor={colors.text.tertiary}
              value={description}
              onChangeText={setDescription}
              editable={!isLoading}
            />
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountField}
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.value && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Split Type Toggle */}
          <View style={styles.section}>
            <View style={styles.splitTypeRow}>
              <View>
                <Text style={styles.label}>Split Type</Text>
                <Text style={styles.splitTypeHint}>
                  {isCustomSplit ? 'Custom amounts' : 'Equal split'}
                </Text>
              </View>
              <Switch
                value={isCustomSplit}
                onValueChange={setIsCustomSplit}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Participants */}
          <View style={styles.section}>
            <Text style={styles.label}>Split With</Text>
            <View style={styles.membersList}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.user_id}
                  style={[
                    styles.memberOption,
                    selectedMembers.has(member.user_id) &&
                      styles.memberOptionSelected,
                  ]}
                  onPress={() => toggleMemberSelection(member.user_id)}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.memberCheckbox,
                      selectedMembers.has(member.user_id) &&
                        styles.memberCheckboxChecked,
                    ]}
                  >
                    {selectedMembers.has(member.user_id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.memberName}>
                    {member.user.display_name}
                    {member.user_id === currentUserId && ' (You)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Split Amounts */}
          {isCustomSplit && (
            <View style={styles.section}>
              <Text style={styles.label}>Split Amounts</Text>
              {Array.from(selectedMembers).map((userId) => {
                const member = members.find((m) => m.user_id === userId);
                if (!member) return null;

                return (
                  <View key={userId} style={styles.customSplitRow}>
                    <Text style={styles.customSplitName}>
                      {member.user.display_name}
                    </Text>
                    <View style={styles.customSplitInput}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.customSplitField}
                        placeholder="0.00"
                        placeholderTextColor={colors.text.tertiary}
                        value={customSplits[userId] || ''}
                        onChangeText={(val) => updateCustomSplit(userId, val)}
                        keyboardType="decimal-pad"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <>
                <Plus size={18} color={colors.background.primary} />
                <Text style={styles.saveButtonText}>
                  {editingEntry ? 'Update' : 'Add Expense'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  title: {
    ...typography.heading2,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  amountInput: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    ...typography.heading2,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  amountField: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryButton: {
    flex: 0.46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  categoryButtonText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  categoryButtonTextActive: {
    color: colors.background.primary,
  },
  splitTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  splitTypeHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  membersList: {
    gap: spacing.sm,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  memberOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  memberCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCheckboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.background.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  memberName: {
    ...typography.body,
    color: colors.text.primary,
  },
  customSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  customSplitName: {
    ...typography.body,
    color: colors.text.primary,
  },
  customSplitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border.medium,
    paddingHorizontal: spacing.md,
  },
  customSplitField: {
    width: 80,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonText: {
    ...typography.label,
    color: colors.background.primary,
  },
});
