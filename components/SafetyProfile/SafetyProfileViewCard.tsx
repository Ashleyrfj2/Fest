/**
 * SafetyProfileViewCard Component
 * 
 * Read-only display of safety profile information.
 * Used for viewing own profile or other members' profiles (in emergencies).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafetyProfile } from '@/lib/safetyTypes';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface Props {
  profile: SafetyProfile;
  isOwn: boolean;
}

export function SafetyProfileViewCard({ profile, isOwn }: Props) {
  const hasAllergies =
    (profile.allergies_food && profile.allergies_food.length > 0) ||
    (profile.allergies_environmental && profile.allergies_environmental.length > 0) ||
    (profile.allergies_medication && profile.allergies_medication.length > 0);

  const hasMedications =
    profile.current_medications && profile.current_medications.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Privacy Banner */}
      {isOwn && (
        <View style={styles.privacyBanner}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Your Private Information</Text>
            <Text style={styles.privacyText}>
              This data is encrypted and only you can see all details.
            </Text>
          </View>
        </View>
      )}

      {/* Personal Information */}
      {(profile.full_name || profile.phone || profile.hometown) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {profile.full_name && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{profile.full_name}</Text>
            </View>
          )}

          {profile.phone && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{profile.phone}</Text>
            </View>
          )}

          {profile.hometown && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Hometown</Text>
              <Text style={styles.fieldValue}>{profile.hometown}</Text>
            </View>
          )}
        </View>
      )}

      {/* Emergency Contact */}
      {(profile.emergency_contact_name ||
        profile.emergency_contact_relationship ||
        profile.emergency_contact_phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          {profile.emergency_contact_name && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{profile.emergency_contact_name}</Text>
            </View>
          )}

          {profile.emergency_contact_relationship && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Relationship</Text>
              <Text style={styles.fieldValue}>
                {profile.emergency_contact_relationship}
              </Text>
            </View>
          )}

          {profile.emergency_contact_phone && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>
                {profile.emergency_contact_phone}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Allergies */}
      {hasAllergies && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Allergies</Text>
          
          {profile.allergies_food && profile.allergies_food.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Food Allergies</Text>
              <View style={styles.chipContainer}>
                {profile.allergies_food.map((allergy) => (
                  <View key={allergy} style={styles.allergyChip}>
                    <Text style={styles.allergyChipText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.allergies_environmental &&
            profile.allergies_environmental.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Environmental Allergies</Text>
                <View style={styles.chipContainer}>
                  {profile.allergies_environmental.map((allergy) => (
                    <View key={allergy} style={styles.allergyChip}>
                      <Text style={styles.allergyChipText}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {profile.allergies_medication && profile.allergies_medication.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Medication Allergies</Text>
              <View style={styles.chipContainer}>
                {profile.allergies_medication.map((allergy) => (
                  <View key={allergy} style={styles.allergyChip}>
                    <Text style={styles.allergyChipText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Medical Information */}
      {(hasMedications || profile.blood_type || profile.notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          {hasMedications && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Current Medications</Text>
              <View style={styles.chipContainer}>
                {profile.current_medications!.map((med) => (
                  <View key={med} style={styles.medChip}>
                    <Text style={styles.medChipText}>{med}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.blood_type && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Blood Type</Text>
              <Text style={styles.fieldValue}>{profile.blood_type}</Text>
            </View>
          )}

          {profile.notes && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <Text style={styles.fieldValue}>{profile.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Empty State */}
      {!profile.full_name &&
        !profile.emergency_contact_name &&
        !hasAllergies &&
        !hasMedications &&
        !profile.notes && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>No safety information yet</Text>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  privacyBanner: {
    backgroundColor: colors.surface.level2,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.accent.gold,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: typography.size.body,
    color: colors.text.mid,
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.surface.level1,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.cardTitle + 1,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  fieldValue: {
    fontSize: typography.size.body + 3,
    color: colors.text.primary,
    lineHeight: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  allergyChip: {
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  allergyChipText: {
    fontSize: typography.size.body,
    color: colors.danger,
    fontWeight: typography.weight.label,
  },
  medChip: {
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.goldDim,
  },
  medChipText: {
    fontSize: typography.size.body,
    color: colors.accent.goldBright,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.size.body + 3,
    color: colors.text.dim,
    textAlign: 'center',
  },
});
