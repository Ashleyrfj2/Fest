/**
 * Travel Plans Data Hooks
 * Real-time data management for vehicles, flights, meetup, and outfits
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
  FlightDetailUpdate,
  OutfitPost,
  OutfitPostInsert,
  OutfitVote,
  OutfitVoteInsert,
  VoteType,
  LatLng,
  TravelProgress,
} from '@/lib/travelTypes';

/**
 * Main hook for travel data
 */
export function useTravel(tripId: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [flights, setFlights] = useState<FlightDetail[]>([]);
  const [outfitPosts, setOutfitPosts] = useState<OutfitPost[]>([]);
  const [tripMeetupPin, setTripMeetupPin] = useState<LatLng | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Fetch all travel data
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch vehicles with driver and passengers
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

      // Fetch flights with user info
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

      // Fetch outfit posts with user and votes
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfit_posts')
        .select(`
          *,
          user:users!outfit_posts_user_id_fkey(id, display_name, avatar_color),
          votes:outfit_votes(
            *,
            user:users!outfit_votes_user_id_fkey(id, display_name, avatar_color)
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (outfitError) throw outfitError;

      // Add vote summaries to outfit posts
      const outfitsWithSummaries = (outfitData || []).map((post) => {
        const votes = post.votes || [];
        const upvotes = votes.filter((v: OutfitVote) => v.vote === 'up').length;
        const downvotes = votes.filter((v: OutfitVote) => v.vote === 'down').length;
        const userVote = votes.find((v: OutfitVote) => v.user_id === userProfile?.id)?.vote || null;

        return {
          ...post,
          vote_summary: {
            upvotes,
            downvotes,
            user_vote: userVote as 'up' | 'down' | null,
          },
        };
      });

      setVehicles(vehicleData as Vehicle[] || []);
      setFlights(flightData as FlightDetail[] || []);
      setOutfitPosts(outfitsWithSummaries);

      // Extract trip-level meetup pin (from any vehicle, or could be stored at trip level)
      const firstVehicleWithPin = (vehicleData || []).find((v) => v.meetup_pin);
      setTripMeetupPin(firstVehicleWithPin?.meetup_pin || null);
    } catch (err) {
      console.error('Error fetching travel data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load travel data');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, userProfile?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const vehicleChannel = supabase
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outfit_posts',
          filter: `trip_id=eq.${tripId}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outfit_votes',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
    };
  }, [tripId, fetchData]);

  // ============================================================================
  // VEHICLE OPERATIONS
  // ============================================================================

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

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: 'vehicle_created',
          module: 'travel',
          target_id: data.id,
          description: `Created vehicle ${vehicleData.make_model || 'ride'}`,
        });

        return { data: data as Vehicle, error: null };
      } catch (err) {
        console.error('Error adding vehicle:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add vehicle',
        };
      }
    },
    [tripId, userProfile?.id]
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

        return { data: data as Vehicle, error: null };
      } catch (err) {
        console.error('Error updating vehicle:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to update vehicle',
        };
      }
    },
    []
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

        // Log activity
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

        return { error: null };
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete vehicle',
        };
      }
    },
    [vehicles, tripId, userProfile?.id]
  );

  // ============================================================================
  // PASSENGER OPERATIONS
  // ============================================================================

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

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'passenger_added',
          module: 'travel',
          target_id: passengerData.vehicle_id,
          description: `Added passenger to vehicle`,
        });

        return { data: data as VehiclePassenger, error: null };
      } catch (err) {
        console.error('Error adding passenger:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to add passenger',
        };
      }
    },
    [tripId, userProfile?.id]
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

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'passenger_removed',
          module: 'travel',
          target_id: vehicleId,
          description: `Removed passenger from vehicle`,
        });

        return { error: null };
      } catch (err) {
        console.error('Error removing passenger:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to remove passenger',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  // ============================================================================
  // FLIGHT OPERATIONS
  // ============================================================================

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
          // Update existing
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
          // Insert new
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

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: existingFlightId ? 'flight_updated' : 'flight_created',
          module: 'travel',
          target_id: data.id,
          description: `${existingFlightId ? 'Updated' : 'Added'} flight details`,
        });

        return { data: data as FlightDetail, error: null };
      } catch (err) {
        console.error('Error saving flight:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save flight',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  const deleteFlight = useCallback(
    async (flightId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('flight_details')
          .delete()
          .eq('id', flightId);

        if (deleteError) throw deleteError;

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile?.id,
          action_type: 'flight_deleted',
          module: 'travel',
          target_id: flightId,
          description: `Deleted flight details`,
        });

        return { error: null };
      } catch (err) {
        console.error('Error deleting flight:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to delete flight',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  // ============================================================================
  // OUTFIT OPERATIONS
  // ============================================================================

  const addOutfitPost = useCallback(
    async (postData: Omit<OutfitPostInsert, 'trip_id' | 'user_id'>) => {
      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      try {
        const { data, error: insertError } = await supabase
          .from('outfit_posts')
          .insert({
            ...postData,
            trip_id: tripId,
            user_id: userProfile.id,
          })
          .select(`
            *,
            user:users!outfit_posts_user_id_fkey(id, display_name, avatar_color)
          `)
          .single();

        if (insertError) throw insertError;

        // Log activity
        await supabase.from('activity_logs').insert({
          trip_id: tripId,
          user_id: userProfile.id,
          action_type: 'outfit_posted',
          module: 'travel',
          target_id: data.id,
          description: `Posted outfit photo`,
        });

        return { data: data as OutfitPost, error: null };
      } catch (err) {
        console.error('Error adding outfit post:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to post outfit',
        };
      }
    },
    [tripId, userProfile?.id]
  );

  const voteOnOutfit = useCallback(
    async (outfitPostId: string, vote: VoteType) => {
      if (!userProfile?.id) {
        return { data: null, error: 'User not authenticated' };
      }

      try {
        // Upsert vote (insert or update)
        const { data, error: upsertError } = await supabase
          .from('outfit_votes')
          .upsert(
            {
              outfit_post_id: outfitPostId,
              user_id: userProfile.id,
              vote,
            },
            {
              onConflict: 'outfit_post_id,user_id',
            }
          )
          .select()
          .single();

        if (upsertError) throw upsertError;

        return { data: data as OutfitVote, error: null };
      } catch (err) {
        console.error('Error voting on outfit:', err);
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Failed to vote',
        };
      }
    },
    [userProfile?.id]
  );

  const removeOutfitVote = useCallback(
    async (outfitPostId: string) => {
      if (!userProfile?.id) {
        return { error: 'User not authenticated' };
      }

      try {
        const { error: deleteError } = await supabase
          .from('outfit_votes')
          .delete()
          .eq('outfit_post_id', outfitPostId)
          .eq('user_id', userProfile.id);

        if (deleteError) throw deleteError;

        return { error: null };
      } catch (err) {
        console.error('Error removing vote:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to remove vote',
        };
      }
    },
    [userProfile?.id]
  );

  // ============================================================================
  // MEETUP PIN OPERATIONS
  // ============================================================================

  const updateTripMeetupPin = useCallback(
    async (meetupPin: LatLng | null) => {
      try {
        // For now, store meetup pin on all vehicles
        // In production, this might be a trip-level field
        const updatePromises = vehicles.map((vehicle) =>
          supabase
            .from('vehicles')
            .update({ meetup_pin: meetupPin })
            .eq('id', vehicle.id)
        );

        await Promise.all(updatePromises);

        setTripMeetupPin(meetupPin);

        // Log activity
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
    [vehicles, tripId, userProfile?.id]
  );

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const progress: TravelProgress = {
    totalMembers: 0, // Would need to fetch from group_members
    membersWithRides: vehicles.reduce((sum, v) => sum + (v.passengers?.length || 0), 0),
    membersNeedingPickup: flights.filter((f) => f.needs_pickup && !f.pickup_vehicle_id).length,
    membersAssigned: vehicles.reduce((sum, v) => sum + (v.passengers?.length || 0), 0) + vehicles.length, // passengers + drivers
  };

  return {
    vehicles,
    flights,
    outfitPosts,
    tripMeetupPin,
    progress,
    isLoading,
    error,
    // Vehicle operations
    addVehicle,
    updateVehicle,
    deleteVehicle,
    // Passenger operations
    addPassenger,
    removePassenger,
    // Flight operations
    addOrUpdateFlight,
    deleteFlight,
    // Outfit operations
    addOutfitPost,
    voteOnOutfit,
    removeOutfitVote,
    // Meetup operations
    updateTripMeetupPin,
    // Refetch
    refetch: fetchData,
  };
}
