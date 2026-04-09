/**
 * Safety Profile Screen
 * 
 * Main screen for viewing and editing emergency/safety information.
 * Supports both edit mode (for own profile) and view mode (for group members).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafetyProfile } from '@/lib/hooks/useSafetyProfile';
import { SafetyProfileEditForm } from '@/components/SafetyProfile/SafetyProfileEditForm';
import { SafetyProfileViewCard } from '@/components/SafetyProfile/SafetyProfileViewCard';
import { SafetyProfileFormData } from '@/lib/safetyTypes';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

export default function SafetyProfileScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [isEditing, setIsEditing] = useState(false);

  const {
    myProfile,
    loading,
    saving,
    error,
    saveSafetyProfile,
    refreshProfile,
  } = useSafetyProfile(tripId!);

  const handleSave = async (formData: SafetyProfileFormData) => {
    try {
      await saveSafetyProfile(formData);
      setIsEditing(false);
      Alert.alert('Success', 'Your safety profile has been saved securely.');
    } catch (err) {
      // Error already handled in hook
      console.error('[SafetyProfileScreen] Save failed:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading safety profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Emergency Info</Text>
        {!isEditing && (
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isEditing ? (
        <SafetyProfileEditForm
          initialData={myProfile}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ) : myProfile ? (
        <SafetyProfileViewCard profile={myProfile} isOwn={true} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyTitle}>No Safety Profile Yet</Text>
          <Text style={styles.emptyDescription}>
            Add your emergency contact and medical information so your group can help in case
            of an emergency.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleEdit}>
            <Text style={styles.createButtonText}>Create Safety Profile</Text>
          </TouchableOpacity>
          
          <View style={styles.whySection}>
            <Text style={styles.whyTitle}>Why add this?</Text>
            <View style={styles.whyItem}>
              <Text style={styles.whyIcon}>🔒</Text>
              <Text style={styles.whyText}>
                Your data is encrypted and only you can edit it
              </Text>
            </View>
            <View style={styles.whyItem}>
              <Text style={styles.whyIcon}>👥</Text>
              <Text style={styles.whyText}>
                Your group can view it in emergencies
              </Text>
            </View>
            <View style={styles.whyItem}>
              <Text style={styles.whyIcon}>📴</Text>
              <Text style={styles.whyText}>
                Works offline—no cell signal needed
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.level1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.size.body + 3,
    color: colors.accent.gold,
    fontWeight: typography.weight.label,
  },
  headerTitle: {
    fontSize: typography.size.cardTitle + 1,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  editButtonText: {
    fontSize: typography.size.body + 3,
    color: colors.accent.gold,
    fontWeight: typography.weight.cardTitle,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.size.body + 3,
    color: colors.text.mid,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
    backgroundColor: colors.base,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.size.body + 3,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.size.body + 3,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.huge,
    paddingTop: 60,
    backgroundColor: colors.base,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.body + 3,
    color: colors.text.mid,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.accent.gold,
    borderRadius: borderRadius.md,
    marginBottom: spacing.huge + spacing.sm,
  },
  createButtonText: {
    fontSize: typography.size.cardTitle + 1,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  whySection: {
    width: '100%',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  whyTitle: {
    fontSize: typography.size.cardTitle + 1,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  whyIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  whyText: {
    flex: 1,
    fontSize: typography.size.body + 2,
    color: colors.text.mid,
    lineHeight: 22,
  },
});
