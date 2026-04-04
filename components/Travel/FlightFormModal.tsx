/**
 * Flight Form Modal Component
 * Add/Edit flight details
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
  Switch,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { FlightDetail, Vehicle } from '@/lib/travelTypes';

interface FlightFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: FlightFormData) => Promise<boolean>;
  editFlight?: FlightDetail | null;
  vehicles?: Vehicle[];
}

export interface FlightFormData {
  airline: string | null;
  flight_number: string | null;
  arrival_airport: string | null;
  arrival_time: string | null;
  needs_pickup: boolean;
  pickup_vehicle_id: string | null;
}

export function FlightFormModal({
  visible,
  onClose,
  onSave,
  editFlight,
  vehicles = [],
}: FlightFormModalProps) {
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [needsPickup, setNeedsPickup] = useState(false);
  const [pickupVehicleId, setPickupVehicleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function normalizeDateTime(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const candidate = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const parsed = new Date(candidate);

    if (Number.isNaN(parsed.getTime())) {
      return '__INVALID__';
    }

    return parsed.toISOString();
  }

  // Populate form when editing
  useEffect(() => {
    if (editFlight) {
      setAirline(editFlight.airline || '');
      setFlightNumber(editFlight.flight_number || '');
      setArrivalAirport(editFlight.arrival_airport || '');
      setArrivalTime(
        editFlight.arrival_time
          ? new Date(editFlight.arrival_time).toISOString().slice(0, 16)
          : ''
      );
      setNeedsPickup(editFlight.needs_pickup || false);
      setPickupVehicleId(editFlight.pickup_vehicle_id || null);
    } else {
      // Reset form
      setAirline('');
      setFlightNumber('');
      setArrivalAirport('');
      setArrivalTime('');
      setNeedsPickup(false);
      setPickupVehicleId(null);
    }
  }, [editFlight, visible]);

  async function handleSave() {
    const normalizedArrivalTime = normalizeDateTime(arrivalTime);
    if (normalizedArrivalTime === '__INVALID__') {
      alert('Please enter a valid arrival time, like 2026-06-15 14:00');
      return;
    }

    setIsSaving(true);
    try {
      const wasSaved = await onSave({
        airline: airline.trim() || null,
        flight_number: flightNumber.trim() || null,
        arrival_airport: arrivalAirport.trim() || null,
        arrival_time: normalizedArrivalTime,
        needs_pickup: needsPickup,
        pickup_vehicle_id: needsPickup ? pickupVehicleId : null,
      });
      if (wasSaved) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving flight:', error);
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
              {editFlight ? 'Edit Flight' : 'Add Flight Details'}
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
            {/* Airline */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Airline (Optional)</Text>
              <TextInput
                style={styles.input}
                value={airline}
                onChangeText={setAirline}
                placeholder="e.g. Delta, United, Southwest"
                placeholderTextColor={colors.text.dim}
                autoCapitalize="words"
              />
            </View>

            {/* Flight Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Flight Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={flightNumber}
                onChangeText={setFlightNumber}
                placeholder="e.g. DL1234"
                placeholderTextColor={colors.text.dim}
                autoCapitalize="characters"
              />
            </View>

            {/* Arrival Airport */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Arrival Airport (Optional)</Text>
              <TextInput
                style={styles.input}
                value={arrivalAirport}
                onChangeText={setArrivalAirport}
                placeholder="e.g. LAX, JFK, ORD"
                placeholderTextColor={colors.text.dim}
                autoCapitalize="characters"
              />
            </View>

            {/* Arrival Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Arrival Time (Optional)</Text>
              <TextInput
                style={styles.input}
                value={arrivalTime}
                onChangeText={setArrivalTime}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.text.dim}
              />
              <Text style={styles.hint}>
                Format: 2026-06-15 14:00
              </Text>
            </View>

            {/* Needs Pickup */}
            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Need pickup from airport?</Text>
                  <Text style={styles.hint}>
                    Let the group know if you need a ride
                  </Text>
                </View>
                <Switch
                  value={needsPickup}
                  onValueChange={(value) => {
                    setNeedsPickup(value);
                    if (!value) {
                      setPickupVehicleId(null);
                    }
                  }}
                  trackColor={{
                    false: colors.surface.level2,
                    true: colors.accent.gold,
                  }}
                  thumbColor={colors.base}
                />
              </View>
            </View>

            {needsPickup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Assign Pickup Vehicle (Optional)</Text>
                <View style={styles.vehicleChoices}>
                  <TouchableOpacity
                    style={[
                      styles.vehicleChoice,
                      pickupVehicleId === null && styles.vehicleChoiceSelected,
                    ]}
                    onPress={() => setPickupVehicleId(null)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.vehicleChoiceText,
                        pickupVehicleId === null && styles.vehicleChoiceTextSelected,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>

                  {vehicles.map((vehicle) => {
                    const availableSeats = Math.max(0, vehicle.capacity - (vehicle.passengers?.length || 0) - 1);
                    const selected = pickupVehicleId === vehicle.id;

                    return (
                      <TouchableOpacity
                        key={vehicle.id}
                        style={[styles.vehicleChoice, selected && styles.vehicleChoiceSelected]}
                        onPress={() => setPickupVehicleId(vehicle.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.vehicleChoiceText, selected && styles.vehicleChoiceTextSelected]}>
                          {vehicle.make_model || 'Ride Available'} - {availableSeats} seat{availableSeats === 1 ? '' : 's'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
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
                {isSaving ? 'Saving...' : editFlight ? 'Update' : 'Save Flight'}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  switchLabel: {
    flex: 1,
    gap: 4,
  },
  vehicleChoices: {
    gap: spacing.sm,
  },
  vehicleChoice: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  vehicleChoiceSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.accent.goldDim,
  },
  vehicleChoiceText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  vehicleChoiceTextSelected: {
    color: colors.base,
    fontWeight: typography.weight.cardTitle,
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
