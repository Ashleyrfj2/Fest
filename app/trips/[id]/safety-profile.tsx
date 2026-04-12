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
  Modal,
  TextInput,
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
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const {
    myProfile,
    loading,
    saving,
    error,
    hasEmergencyAccessPin,
    saveSafetyProfile,
    setEmergencyAccessPin,
    clearEmergencyAccessPin,
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

  const handleSavePin = async () => {
    if (!/^\d{4,8}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4 to 8 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PIN and confirmation do not match.');
      return;
    }

    try {
      await setEmergencyAccessPin(newPin);
      setShowPinModal(false);
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Saved', 'Emergency access PIN updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update emergency PIN.');
    }
  };

  const handleClearPin = async () => {
    Alert.alert('Disable Emergency PIN?', 'This removes PIN-based emergency access for your card.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearEmergencyAccessPin();
            Alert.alert('Disabled', 'Emergency PIN access has been disabled.');
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to disable emergency PIN.');
          }
        },
      },
    ]);
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
      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Emergency Access PIN</Text>
            <Text style={styles.modalDescription}>
              Crew members must enter this PIN to unlock your emergency card.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="New 4-8 digit PIN"
              placeholderTextColor={colors.text.dim}
            />
            <TextInput
              style={styles.modalInput}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="Confirm PIN"
              placeholderTextColor={colors.text.dim}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPinModal(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSavePin}>
                <Text style={styles.modalSaveButtonText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (tripId) {
              router.replace({ pathname: '/trips/[id]', params: { id: tripId } });
              return;
            }
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Emergency Info</Text>
        <View style={styles.headerActions}>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => router.push(`/trips/${tripId}/safety-emergency?tripId=${tripId}`)}
              style={styles.secondaryHeaderButton}
            >
              <Text style={styles.secondaryHeaderButtonText}>Emergency</Text>
            </TouchableOpacity>
          )}
          {!isEditing && (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <View style={styles.profileWrapper}>
          <SafetyProfileViewCard profile={myProfile} isOwn={true} />
          <View style={styles.pinSection}>
            <Text style={styles.pinSectionTitle}>Emergency Access PIN</Text>
            <Text style={styles.pinSectionText}>
              Share this PIN only with trusted crew. They will need it to unlock your card in an emergency.
            </Text>

            <View style={styles.pinActions}>
              <TouchableOpacity style={styles.pinPrimaryButton} onPress={() => setShowPinModal(true)}>
                <Text style={styles.pinPrimaryButtonText}>
                  {hasEmergencyAccessPin ? 'Update PIN' : 'Set PIN'}
                </Text>
              </TouchableOpacity>
              {hasEmergencyAccessPin && (
                <TouchableOpacity style={styles.pinDangerButton} onPress={handleClearPin}>
                  <Text style={styles.pinDangerButtonText}>Disable PIN</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryHeaderButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level2,
  },
  secondaryHeaderButtonText: {
    fontSize: typography.size.body + 1,
    color: colors.text.primary,
    fontWeight: typography.weight.label,
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
  profileWrapper: {
    flex: 1,
  },
  pinSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface.level1,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    padding: spacing.xl,
  },
  pinSectionTitle: {
    fontSize: typography.size.cardTitle,
    color: colors.text.primary,
    fontWeight: typography.weight.cardTitle,
    marginBottom: spacing.sm,
  },
  pinSectionText: {
    fontSize: typography.size.body + 1,
    color: colors.text.mid,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  pinActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pinPrimaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
  },
  pinPrimaryButtonText: {
    color: colors.base,
    fontSize: typography.size.body + 2,
    fontWeight: typography.weight.cardTitle,
  },
  pinDangerButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface.level1,
  },
  pinDangerButtonText: {
    color: colors.danger,
    fontSize: typography.size.body + 2,
    fontWeight: typography.weight.cardTitle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.level1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.size.cardTitle + 1,
    color: colors.text.primary,
    fontWeight: typography.weight.cardTitle,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: typography.size.body + 1,
    color: colors.text.mid,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.base,
    color: colors.text.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.body + 2,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalCancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  modalCancelButtonText: {
    color: colors.text.mid,
    fontSize: typography.size.body + 1,
    fontWeight: typography.weight.label,
  },
  modalSaveButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
  },
  modalSaveButtonText: {
    color: colors.base,
    fontSize: typography.size.body + 1,
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
