export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          module: string | null
          target_id: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          module?: string | null
          target_id?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          module?: string | null
          target_id?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_votes: {
        Row: {
          artist_id: string
          created_at: string
          going_now: boolean
          preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          going_now?: boolean
          preference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          going_now?: boolean
          preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_votes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "lineup_artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          custom_splits: Json | null
          description: string
          id: string
          paid_by: string
          receipt_url: string | null
          split_type: string
          split_with: string[] | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          custom_splits?: Json | null
          description: string
          id?: string
          paid_by: string
          receipt_url?: string | null
          split_type?: string
          split_with?: string[] | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          custom_splits?: Json | null
          description?: string
          id?: string
          paid_by?: string
          receipt_url?: string | null
          split_type?: string
          split_with?: string[] | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_grids: {
        Row: {
          cell_size_ft: number
          created_at: string
          festival_preset: string | null
          height_ft: number
          trip_id: string
          updated_at: string
          width_ft: number
        }
        Insert: {
          cell_size_ft?: number
          created_at?: string
          festival_preset?: string | null
          height_ft: number
          trip_id: string
          updated_at?: string
          width_ft: number
        }
        Update: {
          cell_size_ft?: number
          created_at?: string
          festival_preset?: string | null
          height_ft?: number
          trip_id?: string
          updated_at?: string
          width_ft?: number
        }
        Relationships: [
          {
            foreignKeyName: "camp_grids_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_items: {
        Row: {
          assigned_to: string | null
          color: string | null
          created_at: string
          grid_id: string
          height_cells: number
          id: string
          item_type: string
          label: string | null
          real_height_ft: number
          real_width_ft: number
          updated_at: string
          width_cells: number
          x: number
          y: number
        }
        Insert: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          grid_id: string
          height_cells: number
          id?: string
          item_type: string
          label?: string | null
          real_height_ft: number
          real_width_ft: number
          updated_at?: string
          width_cells: number
          x: number
          y: number
        }
        Update: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          grid_id?: string
          height_cells?: number
          id?: string
          item_type?: string
          label?: string | null
          real_height_ft?: number
          real_width_ft?: number
          updated_at?: string
          width_cells?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "camp_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_items_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "camp_grids"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      change_proposals: {
        Row: {
          action_type: string
          created_at: string
          id: string
          module_id: string
          notes: string | null
          payload: Json
          proposer_id: string
          requested_at: string
          resolved_at: string | null
          resolver_id: string | null
          status: string
          target_entity_id: string | null
          target_entity_type: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          payload: Json
          proposer_id: string
          requested_at?: string
          resolved_at?: string | null
          resolver_id?: string | null
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          payload?: Json
          proposer_id?: string
          requested_at?: string
          resolved_at?: string | null
          resolver_id?: string | null
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_proposals_resolver_id_fkey"
            columns: ["resolver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_proposals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_details: {
        Row: {
          airline: string | null
          arrival_airport: string | null
          arrival_time: string | null
          created_at: string
          flight_number: string | null
          id: string
          needs_pickup: boolean
          pickup_vehicle_id: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          created_at?: string
          flight_number?: string | null
          id?: string
          needs_pickup?: boolean
          pickup_vehicle_id?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          created_at?: string
          flight_number?: string | null
          id?: string
          needs_pickup?: boolean
          pickup_vehicle_id?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_details_pickup_vehicle_id_fkey"
            columns: ["pickup_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_details_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          joined_at: string
          module_permissions: string[] | null
          role: string
          trip_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          module_permissions?: string[] | null
          role: string
          trip_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          module_permissions?: string[] | null
          role?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_artists: {
        Row: {
          created_at: string
          day: string | null
          end_time: string | null
          genre: string | null
          id: string
          name: string
          stage: string | null
          start_time: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day?: string | null
          end_time?: string | null
          genre?: string | null
          id?: string
          name: string
          stage?: string | null
          start_time?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string | null
          end_time?: string | null
          genre?: string | null
          id?: string
          name?: string
          stage?: string | null
          start_time?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_artists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_days: {
        Row: {
          created_at: string
          date: string
          day_label: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          day_label: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          day_label?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          cook_id: string | null
          created_at: string
          dietary_flags: string[] | null
          id: string
          ingredients: string[] | null
          meal_day_id: string
          name: string
          notes: string | null
          slot: string
          updated_at: string
        }
        Insert: {
          cook_id?: string | null
          created_at?: string
          dietary_flags?: string[] | null
          id?: string
          ingredients?: string[] | null
          meal_day_id: string
          name: string
          notes?: string | null
          slot: string
          updated_at?: string
        }
        Update: {
          cook_id?: string | null
          created_at?: string
          dietary_flags?: string[] | null
          id?: string
          ingredients?: string[] | null
          meal_day_id?: string
          name?: string
          notes?: string | null
          slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_meal_day_id_fkey"
            columns: ["meal_day_id"]
            isOneToOne: false
            referencedRelation: "meal_days"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          trip_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          trip_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_posts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_votes: {
        Row: {
          created_at: string
          outfit_post_id: string
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          outfit_post_id: string
          user_id: string
          vote: string
        }
        Update: {
          created_at?: string
          outfit_post_id?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_votes_outfit_post_id_fkey"
            columns: ["outfit_post_id"]
            isOneToOne: false
            referencedRelation: "outfit_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_checks: {
        Row: {
          created_at: string
          packed: boolean
          packing_item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          packed?: boolean
          packing_item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          packed?: boolean
          packing_item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_checks_packing_item_id_fkey"
            columns: ["packing_item_id"]
            isOneToOne: false
            referencedRelation: "packing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_items: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          is_group_item: boolean
          name: string
          trip_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          id?: string
          is_group_item?: boolean
          name: string
          trip_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          is_group_item?: boolean
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_profiles: {
        Row: {
          allergies_environmental: string[] | null
          allergies_food: string[] | null
          allergies_medication: string[] | null
          blood_type: string | null
          created_at: string
          current_medications: string[] | null
          emergency_access_blob: string | null
          emergency_access_pin_hash: string | null
          emergency_access_pin_salt: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          hometown: string | null
          id: string
          notes: string | null
          phone: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies_environmental?: string[] | null
          allergies_food?: string[] | null
          allergies_medication?: string[] | null
          blood_type?: string | null
          created_at?: string
          current_medications?: string[] | null
          emergency_access_blob?: string | null
          emergency_access_pin_hash?: string | null
          emergency_access_pin_salt?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          hometown?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies_environmental?: string[] | null
          allergies_food?: string[] | null
          allergies_medication?: string[] | null
          blood_type?: string | null
          created_at?: string
          current_medications?: string[] | null
          emergency_access_blob?: string | null
          emergency_access_pin_hash?: string | null
          emergency_access_pin_salt?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          hometown?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_profiles_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_items: {
        Row: {
          category: string
          claimed_by: string | null
          created_at: string
          id: string
          name: string
          quantity: number
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          category: string
          claimed_by?: string | null
          created_at?: string
          id?: string
          name: string
          quantity?: number
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          claimed_by?: string | null
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_items_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          end_date: string
          festival_name: string
          id: string
          invite_code: string
          invite_expires_at: string | null
          leader_id: string
          meetup_pin: Json | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          festival_name: string
          id?: string
          invite_code: string
          invite_expires_at?: string | null
          leader_id: string
          meetup_pin?: Json | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          festival_name?: string
          id?: string
          invite_code?: string
          invite_expires_at?: string | null
          leader_id?: string
          meetup_pin?: Json | null
          name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_color: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          last_seen_at: string
          phone: string | null
        }
        Insert: {
          avatar_color: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          last_seen_at?: string
          phone?: string | null
        }
        Update: {
          avatar_color?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          last_seen_at?: string
          phone?: string | null
        }
        Relationships: []
      }
      vehicle_passengers: {
        Row: {
          created_at: string
          pickup_waypoint_index: number | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          pickup_waypoint_index?: number | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          pickup_waypoint_index?: number | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_passengers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_passengers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          departure_city: string | null
          departure_time: string | null
          driver_id: string
          id: string
          make_model: string | null
          meetup_pin: Json | null
          trip_id: string
          updated_at: string
          waypoints: Json | null
        }
        Insert: {
          capacity: number
          created_at?: string
          departure_city?: string | null
          departure_time?: string | null
          driver_id: string
          id?: string
          make_model?: string | null
          meetup_pin?: Json | null
          trip_id: string
          updated_at?: string
          waypoints?: Json | null
        }
        Update: {
          capacity?: number
          created_at?: string
          departure_city?: string | null
          departure_time?: string | null
          driver_id?: string
          id?: string
          make_model?: string | null
          meetup_pin?: Json | null
          trip_id?: string
          updated_at?: string
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_module: {
        Args: { module_name: string; trip_uuid: string; user_uuid: string }
        Returns: boolean
      }
      get_trip_invite_preview: {
        Args: { p_invite_code: string }
        Returns: {
          already_member: boolean
          end_date: string
          festival_name: string
          id: string
          invite_expires_at: string | null
          member_count: number
          name: string
          start_date: string
        }[]
      }
      can_edit_trip: {
        Args: { trip_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_trip_leader: {
        Args: { trip_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_trip_member: {
        Args: { trip_uuid: string; user_uuid: string }
        Returns: boolean
      }
      join_trip_with_invite: {
        Args: { p_invite_code: string }
        Returns: string
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_description: string
          p_module: string
          p_target_id: string
          p_trip_id: string
          p_user_id: string
        }
        Returns: string
      }
      transfer_trip_leadership: {
        Args: { p_new_leader_id: string; p_trip_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
