/**
 * Travel Plans Type Definitions
 * Types for vehicles, flights, meetup, and outfit voting
 */

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface Waypoint {
  address: string;
  lat: number;
  lng: number;
  order: number; // 0-based index for route ordering
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  trip_id: string;
  driver_id: string;
  make_model: string | null;
  capacity: number;
  departure_city: string | null;
  departure_time: string | null; // ISO timestamp
  waypoints: Waypoint[] | null;
  meetup_pin: LatLng | null;
  created_at: string;
  updated_at: string;
  // Joined data
  driver?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  passengers?: VehiclePassenger[];
}

export interface VehicleInsert {
  trip_id: string;
  driver_id: string;
  make_model?: string | null;
  capacity: number;
  departure_city?: string | null;
  departure_time?: string | null;
  waypoints?: Waypoint[] | null;
  meetup_pin?: LatLng | null;
}

export interface VehicleUpdate {
  make_model?: string | null;
  capacity?: number;
  departure_city?: string | null;
  departure_time?: string | null;
  waypoints?: Waypoint[] | null;
  meetup_pin?: LatLng | null;
}

// ============================================================================
// VEHICLE PASSENGER TYPES
// ============================================================================

export interface VehiclePassenger {
  vehicle_id: string;
  user_id: string;
  pickup_waypoint_index: number | null;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface VehiclePassengerInsert {
  vehicle_id: string;
  user_id: string;
  pickup_waypoint_index?: number | null;
}

// ============================================================================
// FLIGHT DETAIL TYPES
// ============================================================================

export interface FlightDetail {
  id: string;
  trip_id: string;
  user_id: string;
  airline: string | null;
  flight_number: string | null;
  arrival_airport: string | null;
  arrival_time: string | null; // ISO timestamp
  needs_pickup: boolean;
  pickup_vehicle_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  pickup_vehicle?: {
    id: string;
    make_model: string | null;
    driver_id: string;
  };
}

export interface FlightDetailInsert {
  trip_id: string;
  user_id: string;
  airline?: string | null;
  flight_number?: string | null;
  arrival_airport?: string | null;
  arrival_time?: string | null;
  needs_pickup?: boolean;
  pickup_vehicle_id?: string | null;
}

export interface FlightDetailUpdate {
  airline?: string | null;
  flight_number?: string | null;
  arrival_airport?: string | null;
  arrival_time?: string | null;
  needs_pickup?: boolean;
  pickup_vehicle_id?: string | null;
}

// ============================================================================
// OUTFIT POST TYPES
// ============================================================================

export interface OutfitPost {
  id: string;
  trip_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  votes?: OutfitVote[];
  vote_summary?: {
    upvotes: number;
    downvotes: number;
    user_vote: 'up' | 'down' | null; // Current user's vote
  };
}

export interface OutfitPostInsert {
  trip_id: string;
  user_id: string;
  photo_url: string;
  caption?: string | null;
}

// ============================================================================
// OUTFIT VOTE TYPES
// ============================================================================

export type VoteType = 'up' | 'down';

export interface OutfitVote {
  outfit_post_id: string;
  user_id: string;
  vote: VoteType;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
}

export interface OutfitVoteInsert {
  outfit_post_id: string;
  user_id: string;
  vote: VoteType;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface TravelData {
  vehicles: Vehicle[];
  flights: FlightDetail[];
  outfitPosts: OutfitPost[];
  tripMeetupPin: LatLng | null; // Shared meetup location for the whole trip
}

export interface VehicleWithPassengers extends Vehicle {
  passengers: VehiclePassenger[];
  availableSeats: number;
}

export interface TravelProgress {
  totalMembers: number;
  membersWithRides: number;
  membersNeedingPickup: number;
  membersAssigned: number;
}
