/**
 * SafetyProfileEditForm Component
 * 
 * Self-owned, private form for emergency information.
 * Clear privacy messaging and secure data handling.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafetyProfile, SafetyProfileFormData, BLOOD_TYPES } from '@/lib/safetyTypes';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface Props {
  initialData?: SafetyProfile | null;
  onSave: (data: SafetyProfileFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function SafetyProfileEditForm({ initialData, onSave, onCancel, saving }: Props) {
  const [formData, setFormData] = useState<SafetyProfileFormData>({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    hometown: initialData?.hometown || '',
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_relationship: initialData?.emergency_contact_relationship || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    allergies_food: initialData?.allergies_food || [],
    allergies_environmental: initialData?.allergies_environmental || [],
    allergies_medication: initialData?.allergies_medication || [],
    current_medications: initialData?.current_medications || [],
    blood_type: initialData?.blood_type || '',
    notes: initialData?.notes || '',
  });

  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');

  const handleSave = async () => {
    // Validate required fields
    if (!formData.full_name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    if (!formData.emergency_contact_name.trim() || !formData.emergency_contact_phone.trim()) {
      Alert.alert(
        'Emergency Contact Required',
        'Please provide an emergency contact name and phone number.'
      );
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save safety profile. Please try again.');
    }
  };

  const addAllergy = (category: 'food' | 'environmental' | 'medication') => {
    const input = allergiesInput.trim();
    if (!input) return;

    const key = `allergies_${category}` as keyof typeof formData;
    const current = formData[key] as string[];
    
    if (!current.includes(input)) {
      setFormData({
        ...formData,
        [key]: [...current, input],
      });
    }
    setAllergiesInput('');
  };

  const removeAllergy = (category: 'food' | 'environmental' | 'medication', item: string) => {
    const key = `allergies_${category}` as keyof typeof formData;
    const current = formData[key] as string[];
    setFormData({
      ...formData,
      [key]: current.filter((i) => i !== item),
    });
  };

  const addMedication = () => {
    const input = medicationsInput.trim();
    if (!input) return;

    if (!formData.current_medications.includes(input)) {
      setFormData({
        ...formData,
        current_medications: [...formData.current_medications, input],
      });
    }
    setMedicationsInput('');
  };

  const removeMedication = (item: string) => {
    setFormData({
      ...formData,
      current_medications: formData.current_medications.filter((i) => i !== item),
    });
  };

  return (
    <View style={styles.container}>
      {/* Privacy Notice */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <View style={styles.privacyTextContainer}>
          <Text style={styles.privacyTitle}>Private & Encrypted</Text>
          <Text style={styles.privacyText}>
            This information is encrypted and only you can edit it. Your trip members can view
            it in emergencies.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            placeholder="Your full legal name"
            placeholderTextColor={colors.text.dim}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Your phone number"
            placeholderTextColor={colors.text.dim}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Hometown</Text>
          <TextInput
            style={styles.input}
            value={formData.hometown}
            onChangeText={(text) => setFormData({ ...formData, hometown: text })}
            placeholder="City, State"
            placeholderTextColor={colors.text.dim}
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Emergency Contact <Text style={styles.required}>*</Text>
          </Text>
          
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact_name}
            onChangeText={(text) =>
              setFormData({ ...formData, emergency_contact_name: text })
            }
            placeholder="Contact's full name"
            placeholderTextColor={colors.text.dim}
          />

          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact_relationship}
            onChangeText={(text) =>
              setFormData({ ...formData, emergency_contact_relationship: text })
            }
            placeholder="e.g., Parent, Spouse, Friend"
            placeholderTextColor={colors.text.dim}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact_phone}
            onChangeText={(text) =>
              setFormData({ ...formData, emergency_contact_phone: text })
            }
            placeholder="Contact's phone number"
            placeholderTextColor={colors.text.dim}
            keyboardType="phone-pad"
          />
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          
          <Text style={styles.label}>Food Allergies</Text>
          <View style={styles.chipContainer}>
            {formData.allergies_food.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={styles.chip}
                onPress={() => removeAllergy('food', allergy)}
              >
                <Text style={styles.chipText}>{allergy}</Text>
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputRowInput]}
              value={allergiesInput}
              onChangeText={setAllergiesInput}
              placeholder="Add food allergy"
              placeholderTextColor={colors.text.dim}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addAllergy('food')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Environmental Allergies</Text>
          <View style={styles.chipContainer}>
            {formData.allergies_environmental.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={styles.chip}
                onPress={() => removeAllergy('environmental', allergy)}
              >
                <Text style={styles.chipText}>{allergy}</Text>
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputRowInput]}
              value={allergiesInput}
              onChangeText={setAllergiesInput}
              placeholder="Add environmental allergy"
              placeholderTextColor={colors.text.dim}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addAllergy('environmental')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Medication Allergies</Text>
          <View style={styles.chipContainer}>
            {formData.allergies_medication.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={styles.chip}
                onPress={() => removeAllergy('medication', allergy)}
              >
                <Text style={styles.chipText}>{allergy}</Text>
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputRowInput]}
              value={allergiesInput}
              onChangeText={setAllergiesInput}
              placeholder="Add medication allergy"
              placeholderTextColor={colors.text.dim}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addAllergy('medication')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <Text style={styles.label}>Current Medications</Text>
          <View style={styles.chipContainer}>
            {formData.current_medications.map((med) => (
              <TouchableOpacity
                key={med}
                style={styles.chip}
                onPress={() => removeMedication(med)}
              >
                <Text style={styles.chipText}>{med}</Text>
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputRowInput]}
              value={medicationsInput}
              onChangeText={setMedicationsInput}
              placeholder="Add medication"
              placeholderTextColor={colors.text.dim}
            />
            <TouchableOpacity style={styles.addButton} onPress={addMedication}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Blood Type (Optional)</Text>
          <View style={styles.bloodTypeContainer}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeButton,
                  formData.blood_type === type && styles.bloodTypeButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, blood_type: type })}
              >
                <Text
                  style={[
                    styles.bloodTypeText,
                    formData.blood_type === type && styles.bloodTypeTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Any other medical information (conditions, disabilities, etc.)"
            placeholderTextColor={colors.text.dim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.base} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  privacyBanner: {
    backgroundColor: colors.surface.level2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.xl,
    backgroundColor: colors.surface.level1,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.cardTitle + 1,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.size.body + 3,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  textArea: {
    minHeight: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputRowInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.accent.gold,
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.base,
    fontSize: 24,
    fontWeight: typography.weight.cardTitle,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface.level3,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  chipText: {
    fontSize: typography.size.body,
    color: colors.text.primary,
  },
  chipRemove: {
    fontSize: 20,
    color: colors.text.dim,
    marginLeft: 4,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bloodTypeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.level2,
  },
  bloodTypeButtonSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  bloodTypeText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  bloodTypeTextSelected: {
    color: colors.base,
    fontWeight: typography.weight.cardTitle,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    fontSize: typography.size.body + 3,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.size.body + 3,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
