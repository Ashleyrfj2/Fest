/**
 * Vehicle Form Modal Component
 * Add/Edit vehicle details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { Vehicle } from '@/lib/travelTypes';

interface VehicleFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: VehicleFormData) => Promise<boolean>;
  editVehicle?: Vehicle | null;
}

export interface VehicleFormData {
  make_model: string | null;
  capacity: number;
  departure_city: string | null;
  departure_time: string | null;
}

export function VehicleFormModal({
  visible,
  onClose,
  onSave,
  editVehicle,
}: VehicleFormModalProps) {
  const [makeModel, setMakeModel] = useState('');
  const [availableSpots, setAvailableSpots] = useState('3');
  const [departureCity, setDepartureCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editVehicle) {
      setMakeModel(editVehicle.make_model || '');
      setAvailableSpots(String(Math.max(0, editVehicle.capacity - 1)));
      setDepartureCity(editVehicle.departure_city || '');
      setDepartureTime(
        editVehicle.departure_time
          ? new Date(editVehicle.departure_time).toISOString().slice(0, 16)
          : ''
      );
    } else {
      // Reset form
      setMakeModel('');
      setAvailableSpots('3');
      setDepartureCity('');
      setDepartureTime('');
    }
  }, [editVehicle, visible]);

  async function handleSave() {
    const spotsNum = parseInt(availableSpots, 10);

    if (isNaN(spotsNum) || spotsNum < 0 || spotsNum > 19) {
      alert('Please enter available spots between 0 and 19');
      return;
    }

    const capacityNum = spotsNum + 1;

    setIsSaving(true);
    try {
      const wasSaved = await onSave({
        make_model: makeModel.trim() || null,
        capacity: capacityNum,
        departure_city: departureCity.trim() || null,
        departure_time: departureTime || null,
      });
      if (wasSaved) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.text.mid} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Make/Model */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Make & Model (Optional)</Text>
              <TextInput
                style={styles.input}
                value={makeModel}
                onChangeText={setMakeModel}
                placeholder="e.g. Honda Accord, Blue Sedan"
                placeholderTextColor={colors.text.dim}
                autoCapitalize="words"
              />
            </View>

            {/* Capacity */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Available Passenger Spots</Text>
              <TextInput
                style={styles.input}
                value={availableSpots}
                onChangeText={setAvailableSpots}
                placeholder="3"
                placeholderTextColor={colors.text.dim}
                keyboardType="number-pad"
              />
              <Text style={styles.hint}>
                Driver seat is added automatically
              </Text>
            </View>

            {/* Departure City */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Departure City (Optional)</Text>
              <TextInput
                style={styles.input}
                value={departureCity}
                onChangeText={setDepartureCity}
                placeholder="e.g. Los Angeles, CA"
                placeholderTextColor={colors.text.dim}
                autoCapitalize="words"
              />
            </View>

            {/* Departure Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Departure Time (Optional)</Text>
              <TextInput
                style={styles.input}
                value={departureTime}
                onChangeText={setDepartureTime}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.text.dim}
              />
              <Text style={styles.hint}>
                Format: 2026-06-15 14:00
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : editVehicle ? 'Update' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.base,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
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
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    letterSpacing: typography.letterSpacing.wide,
  },
  input: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  hint: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface.level1,
  },
  cancelButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.mid,
  },
  saveButton: {
    backgroundColor: colors.accent.gold,
  },
  saveButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
