/**
 * Travel Plans Data Hooks
 * Real-time data management for vehicles, flights, and meetup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehiclePassenger,
  VehiclePassengerInsert,
  FlightDetail,
  FlightDetailInsert,
  MeetupPin,
  TravelProgress,
} from '@/lib/travelTypes';

/**
 * Main hook for travel data
 */
export function useTravel(tripId: string, currentRole?: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [flights, setFlights] = useState<FlightDetail[]>([]);
  const [tripMeetupPin, setTripMeetupPin] = useState<MeetupPin | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const vehicleIdsRef = useRef<Set<string>>(new Set());
  const canMutateTravel = currentRole === 'leader' || currentRole === 'editor';
  // Fail closed so viewers stay read-only even if UI controls regress.
  const travelWritePermissionError = 'Only trip leaders and editors can update travel plans';

  function normalizeMeetupPin(pin: unknown): MeetupPin | null {
    if (!pin || typeof pin !== 'object') {
      return null;
    }

    const candidate = pin as Partial<MeetupPin> & { lat?: unknown; lng?: unknown };

    if (typeof candidate.lat !== 'number' || typeof candidate.lng !== 'number') {
      return null;
    }

    return {
      lat: candidate.lat,
      lng: candidate.lng,
      label: typeof candidate.label === 'string' && candidate.label.trim().length > 0 ? candidate.label : 'Group Meetup',
      notes: typeof candidate.notes === 'string' && candidate.notes.trim().length > 0 ? candidate.notes : null,
      pin_type: candidate.pin_type === 'pickup' || candidate.pin_type === 'carpool' || candidate.pin_type === 'landmark' ? candidate.pin_type : 'meetup',
      created_by_id: typeof candidate.created_by_id === 'string' ? candidate.created_by_id : null,
      created_by_name: typeof candidate.created_by_name === 'string' ? candidate.created_by_name : null,
      updated_at: typeof candidate.updated_at === 'string' && candidate.updated_at.length > 0 ? candidate.updated_at : new Date().toISOString(),
    };
  }

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          driver:users!vehicles_driver_id_fkey(id, display_name, avatar_color),
          passengers:vehicle_passengers(
            *,
            user:users(id, display_name, avatar_color)
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (vehicleError) throw vehicleError;

      const { data: flightData, error: flightError } = await supabase
        .from('flight_details')
        .select(`
          *,
          user:users(id, display_name, avatar_color),
          pickup_vehicle:vehicles(id, make_model, driver_id)
        `)
        .eq('trip_id', tripId)
        .order('arrival_time', { ascending: true });

      if (flightError) throw flightError;

      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('meetup_pin')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      const { count: memberCount, error: membersError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      if (membersError) throw membersError;

      setVehicles((vehicleData as Vehicle[]) || []);
      setFlights((flightData as FlightDetail[]) || []);
      setTotalMembers(memberCount ?? 0);

      const tripMeetupPinData = normalizeMeetupPin(tripData?.meetup_pin);
      const firstVehicleWithPin = (vehicleData || []).find((vehicle) => vehicle.meetup_pin);
      const legacyVehiclePin = firstVehicleWithPin?.meetup_pin
        ? normalizeMeetupPin({
            lat: (firstVehicleWithPin.meetup_pin as { lat?: number; lng?: number }).lat,
            lng: (firstVehicleWithPin.meetup_pin as { lat?: number; lng?: number }).lng,
            label: 'Group Meetup',
            notes: null,
            pin_type: 'meetup',
            created_by_id: firstVehicleWithPin.driver_id,
            created_by_name: firstVehicleWithPin.driver?.display_name || null,
            updated_at: firstVehicleWithPin.updated_at,
          })
        : null;

      setTripMeetupPin(tripMeetupPinData || legacyVehiclePin);
    } catch (err) {
      console.error('Error fetching travel data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load travel data');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    vehicleIdsRef.current = new Set(vehicles.map((vehicle) => vehicle.id));
  }, [vehicles]);

  const handlePassengerChange = useCallback(
    (payload: { new?: { vehicle_id?: string }; old?: { vehicle_id?: string } }) => {
      const vehicleId = payload.new?.vehicle_id ?? payload.old?.vehicle_id;

      if (!vehicleId || vehicleIdsRef.current.has(vehicleId)) {
        void fetchData();
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();

    const travelChannel = supabase
      .channel(`vehicles:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: `trip_id=eq.${tripId}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_passengers',
        },
        (payload) => handlePassengerChange(payload as { new?: { vehicle_id?: string }; old?: { vehicle_id?: string } })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_details',
          filter: `trip_id=eq.${tripId}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          const nextTripRow = payload.new as { meetup_pin?: unknown } | null;

          if (!nextTripRow || !Object.prototype.hasOwnProperty.call(nextTripRow, 'meetup_pin')) {
            void fetchData();
            return;
          }

          setTripMeetupPin(normalizeMeetupPin(nextTripRow.meetup_pin));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(travelChannel);
    };
  }, [tripId, fetchData, handlePassengerChange]);

  const addVehicle = useCallback(
    async (vehicleData: Omit<VehicleInsert, 'trip_id' | 'driver_id'>) => {
      if (!canMutateTravel) {
        return { data: null, error: travelWritePermissionError };
      }

      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      try {
        const { data, error: insertError } = await supabase
          .from('vehicles')
          .insert({
            ...vehicleData,
            trip_id: tripId,
            driver_id: userProfile.id,
          })
          .select(`
            *,
            driver:users!vehicles_driver_id_fkey(id, display_name, avatar_color)
          `)
          .single();

        if (insertError) throw insertError;

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: 'vehicle_created',
          module: 'travel',
          target_id: data.id,
          description: `Created vehicle ${vehicleData.make_model || 'ride'}`,
        });

        void fetchData();

        return { data: data as Vehicle, error: null };
      } catch (err) {
        console.error('Error adding vehicle:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add vehicle',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, userProfile?.id, travelWritePermissionError]
  );

  const updateVehicle = useCallback(
    async (vehicleId: string, updates: VehicleUpdate) => {
      if (!canMutateTravel) {
        return { data: null, error: travelWritePermissionError };
      }

      try {
        const { data, error: updateError } = await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', vehicleId)
          .select(`
            *,
            driver:users!vehicles_driver_id_fkey(id, display_name, avatar_color)
          `)
          .single();

        if (updateError) throw updateError;

        void fetchData();

        return { data: data as Vehicle, error: null };
      } catch (err) {
        console.error('Error updating vehicle:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to update vehicle',
        };
      }
    },
    [canMutateTravel, fetchData, travelWritePermissionError]
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string) => {
      if (!canMutateTravel) {
        return { error: travelWritePermissionError };
      }

      try {
        const vehicle = vehicles.find((v) => v.id === vehicleId);

        const { error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', vehicleId);

        if (deleteError) throw deleteError;

        if (vehicle) {
          await supabase.from('activity_logs').insert({
            trip_id: tripId,
            user_id: userProfile?.id,
            action_type: 'vehicle_deleted',
            module: 'travel',
            target_id: vehicleId,
            description: `Deleted vehicle ${vehicle.make_model || 'ride'}`,
          });
        }

        void fetchData();

        return { error: null };
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete vehicle',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id, vehicles]
  );

  const addPassenger = useCallback(
    async (passengerData: VehiclePassengerInsert) => {
      if (!canMutateTravel) {
        return { data: null, error: travelWritePermissionError };
      }

      try {
        const { data, error: insertError } = await supabase
          .from('vehicle_passengers')
          .insert(passengerData)
          .select(`
            *,
            user:users(id, display_name, avatar_color)
          `)
          .single();

        if (insertError) throw insertError;

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'passenger_added',
          module: 'travel',
          target_id: passengerData.vehicle_id,
          description: `Added passenger to vehicle`,
        });

        void fetchData();

        return { data: data as VehiclePassenger, error: null };
      } catch (err) {
        console.error('Error adding passenger:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add passenger',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id]
  );

  const removePassenger = useCallback(
    async (vehicleId: string, userId: string) => {
      if (!canMutateTravel) {
        return { error: travelWritePermissionError };
      }

      try {
        const { error: deleteError } = await supabase
          .from('vehicle_passengers')
          .delete()
          .eq('vehicle_id', vehicleId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'passenger_removed',
          module: 'travel',
          target_id: vehicleId,
          description: `Removed passenger from vehicle`,
        });

        void fetchData();

        return { error: null };
      } catch (err) {
        console.error('Error removing passenger:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to remove passenger',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id]
  );

  const addOrUpdateFlight = useCallback(
    async (
      flightData: Omit<FlightDetailInsert, 'trip_id' | 'user_id'>,
      flightId?: string
    ) => {
      if (!canMutateTravel) {
        return { data: null, error: travelWritePermissionError };
      }

      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      try {
        let data;
        let existingFlightId = flightId;

        if (!existingFlightId) {
          const { data: existing } = await supabase
            .from('flight_details')
            .select('id')
            .eq('trip_id', tripId)
            .eq('user_id', userProfile.id)
            .single();

          existingFlightId = existing?.id || undefined;
        }

        if (existingFlightId) {
          const { data: updated, error: updateError } = await supabase
            .from('flight_details')
            .update(flightData)
            .eq('id', existingFlightId)
            .select(`
              *,
              user:users(id, display_name, avatar_color),
              pickup_vehicle:vehicles(id, make_model, driver_id)
            `)
            .single();

          if (updateError) throw updateError;
          data = updated;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('flight_details')
            .insert({
              ...flightData,
              trip_id: tripId,
              user_id: userProfile.id,
            })
            .select(`
              *,
              user:users(id, display_name, avatar_color),
              pickup_vehicle:vehicles(id, make_model, driver_id)
            `)
            .single();

          if (insertError) throw insertError;
          data = inserted;
        }

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: existingFlightId ? 'flight_updated' : 'flight_created',
          module: 'travel',
          target_id: data.id,
          description: `${existingFlightId ? 'Updated' : 'Added'} flight details`,
        });

        void fetchData();

        return { data: data as FlightDetail, error: null };
      } catch (err) {
        console.error('Error saving flight:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save flight',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id]
  );

  const deleteFlight = useCallback(
    async (flightId: string) => {
      if (!canMutateTravel) {
        return { error: travelWritePermissionError };
      }

      try {
        const { error: deleteError } = await supabase
          .from('flight_details')
          .delete()
          .eq('id', flightId);

        if (deleteError) throw deleteError;

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'flight_deleted',
          module: 'travel',
          target_id: flightId,
          description: `Deleted flight details`,
        });

        void fetchData();

        return { error: null };
      } catch (err) {
        console.error('Error deleting flight:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete flight',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id]
  );

  const updateTripMeetupPin = useCallback(
    async (meetupPin: MeetupPin | null) => {
      if (!canMutateTravel) {
        return { error: travelWritePermissionError };
      }

      try {
        const { error: updateError } = await supabase
          .from('trips')
          .update({ meetup_pin: meetupPin })
          .eq('id', tripId);

        if (updateError) throw updateError;

        setTripMeetupPin(meetupPin);
        void fetchData();

        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'meetup_pin_updated',
          module: 'travel',
          target_id: tripId,
          description: `Updated group meetup location`,
        });

        return { error: null };
      } catch (err) {
        console.error('Error updating meetup pin:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to update meetup pin',
        };
      }
    },
    [canMutateTravel, fetchData, tripId, travelWritePermissionError, userProfile?.id]
  );

  const assignedMemberIds = new Set<string>();
  vehicles.forEach((vehicle) => {
    assignedMemberIds.add(vehicle.driver_id);
    (vehicle.passengers || []).forEach((passenger) => {
      assignedMemberIds.add(passenger.user_id);
    });
  });

  const progress: TravelProgress = {
    totalMembers,
    membersWithRides: assignedMemberIds.size,
    membersNeedingPickup: flights.filter((f) => f.needs_pickup && !f.pickup_vehicle_id).length,
    membersAssigned: assignedMemberIds.size,
  };

  return {
    vehicles,
    flights,
    tripMeetupPin,
    progress,
    isLoading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addPassenger,
    removePassenger,
    addOrUpdateFlight,
    deleteFlight,
    updateTripMeetupPin,
    refetch: fetchData,
  };
}
