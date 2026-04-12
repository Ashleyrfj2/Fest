/**
 * Supply List Screen
 * Collaborative supply tracking with real-time updates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Package } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSupplyList } from '@/lib/hooks/useSupplyList';
import { supabase } from '@/lib/supabase';
import {
  CategorySection,
  AddEditSupplyModal,
} from '@/components/SupplyList';
import { SupplyItem, SupplyCategory } from '@/lib/supplyTypes';

export default function SupplyListScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load supply list data
  const {
    categoryGroups,
    progress,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    claimItem,
    unclaimItem,
    togglePacked,
    findDuplicates,
  } = useSupplyList(tripId);

  // Load user role
  React.useEffect(() => {
    loadUserRole();
  }, [tripId, userProfile?.id]);

  async function loadUserRole() {
    if (!userProfile?.id || !tripId) return;

    try {
      const { data } = await supabase
        .from('group_members')
        .select('role')
        .eq('trip_id', tripId)
        .eq('user_id', userProfile.id)
        .single();

      setCurrentRole(data?.role || null);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }

  const isEditor = currentRole === 'leader' || currentRole === 'editor';

  async function handleAddItem(data: {
    name: string;
    quantity: number;
    category: SupplyCategory;
  }) {
    const result = await addItem(data);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleEditItem(data: {
    name: string;
    quantity: number;
    category: SupplyCategory;
  }) {
    if (!editingItem) return;

    const result = await updateItem(editingItem.id, data);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleSaveItem(data: {
    name: string;
    quantity: number;
    category: SupplyCategory;
  }) {
    if (editingItem) {
      await handleEditItem(data);
    } else {
      await handleAddItem(data);
    }
  }

  function handleOpenModal(item?: SupplyItem) {
    setEditingItem(item || null);
    setIsModalVisible(true);
  }

  function handleCloseModal() {
    setIsModalVisible(false);
    setEditingItem(null);
  }

  async function handleClaimItem(itemId: string) {
    const result = await claimItem(itemId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleUnclaimItem(itemId: string) {
    const result = await unclaimItem(itemId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleTogglePacked(itemId: string) {
    const result = await togglePacked(itemId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleDeleteItem(itemId: string) {
    const result = await deleteItem(itemId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading supplies...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load supply list</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </SafeAreaView>
    );
  }

  // Empty state
  const isEmpty = categoryGroups.length === 0;

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
          <Text style={styles.headerTitle}>Supply List</Text>
          {!isEmpty && (
            <Text style={styles.headerSubtitle}>
              {progress.packed} of {progress.total} packed ({progress.percentPacked}%)
            </Text>
          )}
        </View>

        {isEditor && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleOpenModal()}
            activeOpacity={0.7}
          >
            <Plus size={24} color={colors.base} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {!isEmpty && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.percentPacked}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Package size={48} color={colors.text.dim} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No supplies yet</Text>
            <Text style={styles.emptyMessage}>
              Start adding items to track who's bringing what
            </Text>
            {isEditor && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => handleOpenModal()}
                activeOpacity={0.7}
              >
                <Plus size={20} color={colors.base} strokeWidth={2} />
                <Text style={styles.emptyAddButtonText}>Add First Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Category Groups */
          categoryGroups.map((group) => (
            <CategorySection
              key={group.category.id}
              group={group}
              currentUserId={userProfile?.id}
              onClaim={handleClaimItem}
              onUnclaim={handleUnclaimItem}
              onTogglePacked={handleTogglePacked}
              onEdit={handleOpenModal}
              onDelete={handleDeleteItem}
              isEditor={isEditor}
            />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <AddEditSupplyModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        editItem={editingItem}
        findDuplicates={findDuplicates}
      />
    </SafeAreaView>
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
    paddingVertical: spacing.md,
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
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
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
});
