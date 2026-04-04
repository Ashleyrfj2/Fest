import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  House,
  PackageOpen,
  Package,
  Plus,
  Shirt,
  Square,
  Trash2,
  User,
  Utensils,
} from 'lucide-react-native';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getPackingCategoryMeta,
  PACKING_CATEGORIES,
  PackingCategory,
  PackingItemInsert,
  PackingItemWithState,
} from '@/lib/packingTypes';
import { usePackingList } from '@/lib/hooks/usePackingList';

type MemberOption = {
  user_id: string;
  role: 'leader' | 'editor' | 'viewer';
  user: {
    id: string;
    display_name: string;
    avatar_color: string;
  } | null;
};

type AddModalState = {
  open: boolean;
  name: string;
  category: PackingCategory;
  isGroupItem: boolean;
  assignedTo: string | null;
};

const DEFAULT_ADD_MODAL: AddModalState = {
  open: false,
  name: '',
  category: 'shelter',
  isGroupItem: false,
  assignedTo: null,
};

const CATEGORY_ICONS: Record<PackingCategory, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  shelter: House,
  festival_gear: PackageOpen,
  clothing: Shirt,
  hygiene: User,
  medical: Heart,
  kitchen: Utensils,
  comfort: Package,
};

export default function PackingChecklistScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<'leader' | 'editor' | 'viewer' | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<PackingCategory, boolean>>({
    shelter: true,
    festival_gear: true,
    clothing: true,
    hygiene: true,
    medical: true,
    kitchen: true,
    comfort: true,
  });
  const [addModal, setAddModal] = useState<AddModalState>(DEFAULT_ADD_MODAL);
  const [assignModalItem, setAssignModalItem] = useState<PackingItemWithState | null>(null);

  const {
    categoryOrder,
    categoryGroups,
    categoryProgress,
    overallProgress,
    isLoading,
    error,
    addItem,
    deleteItem,
    togglePacked,
    assignGroupItem,
    loadTemplates,
  } = usePackingList(tripId);

  const totalItems = overallProgress.total;
  const isEditor = currentRole === 'leader' || currentRole === 'editor';

  useEffect(() => {
    void loadMembershipContext();
  }, [tripId, userProfile?.id]);

  async function loadMembershipContext() {
    if (!tripId || !userProfile?.id) return;

    try {
      const { data: roleData } = await supabase
        .from('group_members')
        .select('role')
        .eq('trip_id', tripId)
        .eq('user_id', userProfile.id)
        .single();

      setCurrentRole((roleData?.role as 'leader' | 'editor' | 'viewer' | undefined) ?? null);

      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, role, user:users(id, display_name, avatar_color)')
        .eq('trip_id', tripId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      const normalized = ((membersData ?? []) as Array<MemberOption & {
        user?: MemberOption['user'][] | MemberOption['user'];
      }>).map((member) => ({
        ...member,
        user: Array.isArray(member.user) ? member.user[0] ?? null : member.user ?? null,
      }));

      setMembers(normalized);
    } catch (loadError) {
      console.error('Error loading packing membership context:', loadError);
    }
  }

  const memberOptions = useMemo(
    () =>
      members
        .map((member) => ({
          id: member.user_id,
          name: member.user?.display_name ?? 'Crew member',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );

  async function handleTogglePacked(itemId: string) {
    const result = await togglePacked(itemId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleDeleteItem(itemId: string) {
    Alert.alert('Delete Item', 'Remove this item from the packing list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteItem(itemId);
          if (result.error) {
            Alert.alert('Error', result.error);
          }
        },
      },
    ]);
  }

  async function handleLoadTemplates() {
    const result = await loadTemplates();
    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }

    if (result.inserted > 0) {
      Alert.alert('Starter List Loaded', `${result.inserted} starter items added.`);
    }
  }

  function openAddModal() {
    setAddModal({ ...DEFAULT_ADD_MODAL, open: true });
  }

  function closeAddModal() {
    setAddModal(DEFAULT_ADD_MODAL);
  }

  async function handleSaveAddModal() {
    const trimmedName = addModal.name.trim();
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter an item name.');
      return;
    }

    const payload: Omit<PackingItemInsert, 'trip_id' | 'id' | 'created_at'> = {
      name: trimmedName,
      category: addModal.category,
      is_group_item: addModal.isGroupItem,
      assigned_to: addModal.isGroupItem ? addModal.assignedTo : null,
    };

    const result = await addItem(payload);
    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }

    closeAddModal();
  }

  async function handleAssign(itemId: string, userId: string | null) {
    const result = await assignGroupItem(itemId, userId);
    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }

    setAssignModalItem(null);
  }

  function toggleCategory(category: PackingCategory) {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading packing checklist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load packing checklist</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push(`/trips/${tripId}`)} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Packing</Text>
          <Text style={styles.headerSubtitle}>
            {overallProgress.packed} of {overallProgress.total} packed ({overallProgress.percentPacked}%)
          </Text>
        </View>

        {isEditor ? (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.7}>
            <Plus size={24} color={colors.base} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButtonPlaceholder} />
        )}
      </View>

      {totalItems > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallProgress.percentPacked}%` }]} />
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {totalItems === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Package size={48} color={colors.text.dim} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No packing items yet</Text>
            <Text style={styles.emptyMessage}>
              Load the starter list to begin tracking your trip essentials.
            </Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleLoadTemplates} activeOpacity={0.7}>
              <Plus size={20} color={colors.base} strokeWidth={2} />
              <Text style={styles.emptyAddButtonText}>Load Starter List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categoryOrder.map((categoryId) => {
            const meta = getPackingCategoryMeta(categoryId);
            const items = categoryGroups[categoryId];
            const progress = categoryProgress.find((entry) => entry.category === categoryId);
            const isExpanded = expandedCategories[categoryId];

            return (
              <View key={categoryId} style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleCategory(categoryId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    {React.createElement(CATEGORY_ICONS[categoryId], {
                      size: 16,
                      color: colors.accent.gold,
                      strokeWidth: 2,
                    })}
                    <View>
                      <Text style={styles.sectionTitle}>{meta.label}</Text>
                      <Text style={styles.sectionSubtitle}>
                        {progress?.packed ?? 0} / {progress?.total ?? 0} packed
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? (
                    <ChevronDown size={18} color={colors.text.mid} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={18} color={colors.text.mid} strokeWidth={2} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.sectionItems}>
                    {items.length === 0 ? (
                      <Text style={styles.categoryEmpty}>Nothing here yet.</Text>
                    ) : (
                      items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <TouchableOpacity
                            style={styles.checkboxButton}
                            onPress={() => handleTogglePacked(item.id)}
                            activeOpacity={0.7}
                          >
                            {item.packed ? (
                              <View style={styles.checkboxFilled}>
                                <Check size={14} color={colors.base} strokeWidth={2.6} />
                              </View>
                            ) : (
                              <View style={styles.checkboxEmpty} />
                            )}
                          </TouchableOpacity>

                          <View style={styles.itemContent}>
                            <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
                              {item.name}
                            </Text>

                            {item.is_group_item && (
                              <View style={styles.groupMetaRow}>
                                <View style={styles.groupBadge}>
                                  <Text style={styles.groupBadgeText}>Group</Text>
                                </View>
                                <View style={styles.assigneeWrap}>
                                  <User size={12} color={colors.text.mid} strokeWidth={2} />
                                  <Text style={styles.assigneeText}>
                                    {item.assignedToUser?.display_name ?? 'Unassigned'}
                                  </Text>
                                </View>
                                {isEditor && (
                                  <TouchableOpacity
                                    onPress={() => setAssignModalItem(item)}
                                    activeOpacity={0.7}
                                    style={styles.assignButton}
                                  >
                                    <Text style={styles.assignButtonText}>Assign</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>

                          {isEditor && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteItem(item.id)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={addModal.open}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Packing Item</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={addModal.name}
              onChangeText={(value) => setAddModal((prev) => ({ ...prev, name: value }))}
              placeholder="Item name"
              placeholderTextColor={colors.text.dim}
              style={styles.textInput}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPickerWrap}>
              {PACKING_CATEGORIES.map((category) => {
                const selected = category.id === addModal.category;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                    onPress={() => setAddModal((prev) => ({ ...prev, category: category.id }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.groupToggleRow}
              onPress={() =>
                setAddModal((prev) => ({
                  ...prev,
                  isGroupItem: !prev.isGroupItem,
                  assignedTo: !prev.isGroupItem ? prev.assignedTo : null,
                }))
              }
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.inputLabel}>Group item</Text>
                <Text style={styles.helperText}>Assign one owner for shared crew gear.</Text>
              </View>
              {addModal.isGroupItem ? <Check size={20} color={colors.accent.gold} strokeWidth={2.6} /> : <Square size={22} color={colors.text.mid} strokeWidth={2} />}
            </TouchableOpacity>

            {addModal.isGroupItem && (
              <View style={styles.assignPickerBlock}>
                <Text style={styles.inputLabel}>Assign to</Text>
                <View style={styles.assignPickerList}>
                  <TouchableOpacity
                    style={[
                      styles.assignOption,
                      addModal.assignedTo === null && styles.assignOptionActive,
                    ]}
                    onPress={() => setAddModal((prev) => ({ ...prev, assignedTo: null }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.assignOptionText,
                        addModal.assignedTo === null && styles.assignOptionTextActive,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>
                  {memberOptions.map((member) => {
                    const selected = addModal.assignedTo === member.id;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.assignOption, selected && styles.assignOptionActive]}
                        onPress={() => setAddModal((prev) => ({ ...prev, assignedTo: member.id }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.assignOptionText, selected && styles.assignOptionTextActive]}>
                          {member.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddModal} activeOpacity={0.7}>
                <Text style={styles.saveButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(assignModalItem)}
        animationType="fade"
        transparent
        onRequestClose={() => setAssignModalItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Group Item</Text>
            <Text style={styles.assignModalSubtitle}>{assignModalItem?.name}</Text>

            <View style={styles.assignPickerList}>
              <TouchableOpacity
                style={styles.assignOption}
                onPress={() => assignModalItem && handleAssign(assignModalItem.id, null)}
                activeOpacity={0.7}
              >
                <Text style={styles.assignOptionText}>Unassigned</Text>
              </TouchableOpacity>

              {memberOptions.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.assignOption}
                  onPress={() => assignModalItem && handleAssign(assignModalItem.id, member.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.assignOptionText}>{member.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setAssignModalItem(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  errorText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  errorMessage: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface.level2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.gold,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  emptyMessage: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  emptyAddButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  sectionCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.level2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginTop: 2,
  },
  sectionItems: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryEmpty: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  checkboxButton: {
    paddingTop: 1,
  },
  checkboxFilled: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.text.mid,
    backgroundColor: 'transparent',
  },
  itemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  itemNamePacked: {
    color: colors.text.mid,
    textDecorationLine: 'line-through',
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  groupBadge: {
    backgroundColor: `${colors.text.dim}33`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  groupBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  assigneeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  assignButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level3,
  },
  assignButtonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.accent.gold,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.danger}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryChipActive: {
    borderColor: colors.accent.gold,
    backgroundColor: `${colors.accent.gold}22`,
  },
  categoryChipText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  categoryChipTextActive: {
    color: colors.accent.gold,
  },
  groupToggleRow: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    marginTop: 2,
    fontSize: typography.size.meta,
    color: colors.text.dim,
  },
  assignPickerBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  assignPickerList: {
    gap: spacing.xs,
  },
  assignOption: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  assignOptionActive: {
    borderColor: colors.accent.gold,
    backgroundColor: `${colors.accent.gold}20`,
  },
  assignOptionText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  assignOptionTextActive: {
    color: colors.accent.gold,
    fontWeight: typography.weight.label,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  assignModalSubtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginBottom: spacing.sm,
  },
});
