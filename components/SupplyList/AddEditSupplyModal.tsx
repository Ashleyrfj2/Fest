/**
 * Add/Edit Supply Item Modal
 * Modal for creating or editing supply items with duplicate detection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import {
  SupplyItem,
  SupplyCategory,
  SUPPLY_CATEGORIES,
  getCategoryMetadata,
} from '@/lib/supplyTypes';

interface AddEditSupplyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    quantity: number;
    category: SupplyCategory;
  }) => Promise<void>;
  editItem?: SupplyItem | null;
  findDuplicates: (name: string, excludeId?: string) => SupplyItem[];
}

export function AddEditSupplyModal({
  visible,
  onClose,
  onSave,
  editItem,
  findDuplicates,
}: AddEditSupplyModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<SupplyCategory>('misc');
  const [isSaving, setIsSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<SupplyItem[]>([]);

  // Initialize form when edit item changes or modal opens
  useEffect(() => {
    if (visible) {
      if (editItem) {
        setName(editItem.name);
        setQuantity(editItem.quantity.toString());
        setSelectedCategory(editItem.category);
      } else {
        setName('');
        setQuantity('1');
        setSelectedCategory('misc');
      }
      setDuplicates([]);
    }
  }, [visible, editItem]);

  // Check for duplicates when name changes
  useEffect(() => {
    if (name.trim().length > 2) {
      const found = findDuplicates(name, editItem?.id);
      setDuplicates(found);
    } else {
      setDuplicates([]);
    }
  }, [name, editItem?.id, findDuplicates]);

  async function handleSave() {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an item name');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Invalid Quantity', 'Quantity must be at least 1');
      return;
    }

    // Show duplicate warning
    if (duplicates.length > 0 && !editItem) {
      Alert.alert(
        'Possible Duplicate',
        `Similar items already exist:\n\n${duplicates
          .slice(0, 3)
          .map((d) => `• ${d.name}`)
          .join('\n')}\n\nDo you still want to add this item?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            onPress: () => saveItem(qty),
          },
        ]
      );
    } else {
      await saveItem(qty);
    }
  }

  async function saveItem(qty: number) {
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        quantity: qty,
        category: selectedCategory,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  }

  function handleQuantityChange(text: string) {
    // Only allow numbers
    const filtered = text.replace(/[^0-9]/g, '');
    setQuantity(filtered || '1');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editItem ? 'Edit Item' : 'Add Supply Item'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.text.mid} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Duplicate Warning */}
            {duplicates.length > 0 && !editItem && (
              <View style={styles.duplicateWarning}>
                <AlertCircle size={20} color={colors.warning} strokeWidth={2} />
                <View style={styles.duplicateContent}>
                  <Text style={styles.duplicateTitle}>Similar items found:</Text>
                  {duplicates.slice(0, 3).map((dup) => (
                    <Text key={dup.id} style={styles.duplicateItem}>
                      • {dup.name}
                      {dup.claimedByUser && ` (${dup.claimedByUser.display_name})`}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Item Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Tent, Cooler, Sunscreen"
                placeholderTextColor={colors.text.dim}
                autoFocus
              />
            </View>

            {/* Quantity */}
            <View style={styles.field}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={handleQuantityChange}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.text.dim}
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {SUPPLY_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionSelected,
                        isSelected && { borderColor: cat.color },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          isSelected && { color: cat.color },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.base} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editItem ? 'Save Changes' : 'Add Item'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.base,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  duplicateWarning: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  duplicateContent: {
    flex: 1,
    gap: spacing.xs,
  },
  duplicateTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.warning,
  },
  duplicateItem: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryOptionSelected: {
    backgroundColor: colors.surface.level2,
    borderWidth: 2,
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cancelButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.mid,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
