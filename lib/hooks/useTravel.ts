/**
 * Travel Plans Data Hooks
 * Real-time data management for vehicles, flights, and meetup
 */

import { useState, useEffect, useCallback } from 'react';
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
export function useTravel(tripId: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [flights, setFlights] = useState<FlightDetail[]>([]);
  const [tripMeetupPin, setTripMeetupPin] = useState<MeetupPin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

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

      setVehicles((vehicleData as Vehicle[]) || []);
      setFlights((flightData as FlightDetail[]) || []);

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
        () => fetchData()
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
      .subscribe();

    return () => {
      supabase.removeChannel(travelChannel);
    };
  }, [tripId, fetchData]);

  const addVehicle = useCallback(
    async (vehicleData: Omit<VehicleInsert, 'trip_id' | 'driver_id'>) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const updateVehicle = useCallback(
    async (vehicleId: string, updates: VehicleUpdate) => {
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
    [fetchData]
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string) => {
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
    [fetchData, tripId, userProfile?.id, vehicles]
  );

  const addPassenger = useCallback(
    async (passengerData: VehiclePassengerInsert) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const removePassenger = useCallback(
    async (vehicleId: string, userId: string) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const addOrUpdateFlight = useCallback(
    async (
      flightData: Omit<FlightDetailInsert, 'trip_id' | 'user_id'>,
      flightId?: string
    ) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const deleteFlight = useCallback(
    async (flightId: string) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const updateTripMeetupPin = useCallback(
    async (meetupPin: MeetupPin | null) => {
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
    [fetchData, tripId, userProfile?.id]
  );

  const progress: TravelProgress = {
    totalMembers: 0,
    membersWithRides: vehicles.reduce((sum, v) => sum + (v.passengers?.length || 0), 0),
    membersNeedingPickup: flights.filter((f) => f.needs_pickup && !f.pickup_vehicle_id).length,
    membersAssigned: vehicles.reduce((sum, v) => sum + (v.passengers?.length || 0), 0) + vehicles.length,
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
