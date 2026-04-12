/**
 * Travel Plans Screen
 * Collaborative travel coordination with vehicles, flights, and meetup
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
import { ArrowLeft, Plus, Car, Plane } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTravel } from '@/lib/hooks/useTravel';
import { supabase } from '@/lib/supabase';
import {
  VehicleCard,
  VehicleFormModal,
  FlightCard,
  FlightFormModal,
  MeetupMap,
} from '@/components/Travel';
import {
  Vehicle,
  FlightDetail,
  VehiclePassengerInsert,
  MeetupPin,
} from '@/lib/travelTypes';
import { VehicleFormData } from '@/components/Travel/VehicleFormModal';
import { FlightFormData } from '@/components/Travel/FlightFormModal';

export default function TravelScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingFlight, setEditingFlight] = useState<FlightDetail | null>(null);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [isFlightModalVisible, setIsFlightModalVisible] = useState(false);

  // Load travel data
  const {
    vehicles,
    flights,
    tripMeetupPin,
    progress,
    isLoading,
    error,
    refetch,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addPassenger,
    removePassenger,
    addOrUpdateFlight,
    deleteFlight,
    updateTripMeetupPin,
  } = useTravel(tripId);

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

  // ============================================================================
  // VEHICLE HANDLERS
  // ============================================================================

  function handleOpenVehicleModal(vehicle?: Vehicle) {
    setEditingVehicle(vehicle || null);
    setIsVehicleModalVisible(true);
  }

  function handleCloseVehicleModal() {
    setIsVehicleModalVisible(false);
    setEditingVehicle(null);
  }

  async function handleSaveVehicle(data: VehicleFormData) {
    if (editingVehicle) {
      const result = await updateVehicle(editingVehicle.id, data);
      if (result.error) {
        Alert.alert('Error', result.error);
        return false;
      }
      await refetch();
      return true;
    } else {
      const result = await addVehicle(data);
      if (result.error) {
        Alert.alert('Error', result.error);
        return false;
      }
      await refetch();
      return true;
    }
  }

  async function handleDeleteVehicle(vehicleId: string) {
    const result = await deleteVehicle(vehicleId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleAddPassenger(vehicleId: string) {
    if (!userProfile?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    const passengerData: VehiclePassengerInsert = {
      vehicle_id: vehicleId,
      user_id: userProfile.id,
      pickup_waypoint_index: null,
    };

    const result = await addPassenger(passengerData);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  async function handleRemovePassenger(vehicleId: string, userId: string) {
    const result = await removePassenger(vehicleId, userId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // ============================================================================
  // FLIGHT HANDLERS
  // ============================================================================

  function handleOpenFlightModal(flight?: FlightDetail) {
    setEditingFlight(flight || null);
    setIsFlightModalVisible(true);
  }

  function handleCloseFlightModal() {
    setIsFlightModalVisible(false);
    setEditingFlight(null);
  }

  async function handleSaveFlight(data: FlightFormData) {
    const result = await addOrUpdateFlight(data, editingFlight?.id);
    if (result.error) {
      Alert.alert('Error', result.error);
      return false;
    }
    await refetch();
    return true;
  }

  async function handleDeleteFlight(flightId: string) {
    const result = await deleteFlight(flightId);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // ============================================================================
  // MEETUP HANDLERS
  // ============================================================================

  async function handleUpdateMeetupPin(pin: MeetupPin | null) {
    const normalizedPin = pin
      ? {
          ...pin,
          created_by_id: pin.created_by_id || userProfile?.id || null,
          created_by_name: pin.created_by_name || userProfile?.display_name || null,
        }
      : null;

    const result = await updateTripMeetupPin(normalizedPin);
    if (result.error) {
      Alert.alert('Error', result.error);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
        <Text style={styles.loadingText}>Loading travel plans...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load travel plans</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Travel Plans</Text>
          {progress.membersAssigned > 0 && (
            <Text style={styles.headerSubtitle}>
              {progress.membersAssigned} member{progress.membersAssigned === 1 ? '' : 's'} with rides
            </Text>
          )}
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Car size={20} color={colors.accent.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Vehicles</Text>
            </View>
            {isEditor && (
              <TouchableOpacity
                style={styles.sectionAddButton}
                onPress={() => handleOpenVehicleModal()}
                activeOpacity={0.7}
              >
                <Plus size={20} color={colors.base} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {vehicles.length > 0 ? (
            <View style={styles.list}>
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  currentUserId={userProfile?.id}
                  isEditor={isEditor}
                  onEdit={handleOpenVehicleModal}
                  onDelete={handleDeleteVehicle}
                  onAddPassenger={handleAddPassenger}
                  onRemovePassenger={handleRemovePassenger}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No vehicles added yet</Text>
              {isEditor && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => handleOpenVehicleModal()}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.base} strokeWidth={2} />
                  <Text style={styles.emptyAddButtonText}>Add First Vehicle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Flights Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Plane size={20} color={colors.accent.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Flights</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionAddButton}
              onPress={() => handleOpenFlightModal()}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.base} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {flights.length > 0 ? (
            <View style={styles.list}>
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  currentUserId={userProfile?.id}
                  isEditor={isEditor}
                  onEdit={handleOpenFlightModal}
                  onDelete={handleDeleteFlight}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No flights added yet</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => handleOpenFlightModal()}
                activeOpacity={0.7}
              >
                <Plus size={16} color={colors.base} strokeWidth={2} />
                <Text style={styles.emptyAddButtonText}>Add Your Flight</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Meetup Map Section */}
        <View style={styles.section}>
          <MeetupMap
            meetupPin={tripMeetupPin}
            onUpdatePin={handleUpdateMeetupPin}
            isEditor={isEditor}
          />
        </View>

      </ScrollView>

      {/* Modals */}
      <VehicleFormModal
        visible={isVehicleModalVisible}
        onClose={handleCloseVehicleModal}
        onSave={handleSaveVehicle}
        editVehicle={editingVehicle}
      />

      <FlightFormModal
        visible={isFlightModalVisible}
        onClose={handleCloseFlightModal}
        onSave={handleSaveFlight}
        editFlight={editingFlight}
        vehicles={vehicles}
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  sectionAddButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.md,
  },
  emptySection: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    fontStyle: 'italic',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyAddButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
