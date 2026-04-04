/**
 * Database Type Definitions
 * Auto-generated types for Supabase tables
 *
 * To regenerate: npx supabase gen types typescript --project-id tumtuhzrgczhkiirdpqt > lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          avatar_color: string
          phone: string | null
          email: string | null
          created_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          display_name: string
          avatar_color: string
          phone?: string | null
          email?: string | null
          created_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_color?: string
          phone?: string | null
          email?: string | null
          created_at?: string
          last_seen_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          festival_name: string
          start_date: string
          end_date: string
          leader_id: string
          invite_code: string
          invite_expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          festival_name: string
          start_date: string
          end_date: string
          leader_id: string
          invite_code: string
          invite_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          festival_name?: string
          start_date?: string
          end_date?: string
          leader_id?: string
          invite_code?: string
          invite_expires_at?: string | null
          created_at?: string
        }
      }
      group_members: {
        Row: {
          user_id: string
          trip_id: string
          role: 'leader' | 'editor' | 'viewer'
          module_permissions: string[] | null
          joined_at: string
        }
        Insert: {
          user_id: string
          trip_id: string
          role: 'leader' | 'editor' | 'viewer'
          module_permissions?: string[] | null
          joined_at?: string
        }
        Update: {
          user_id?: string
          trip_id?: string
          role?: 'leader' | 'editor' | 'viewer'
          module_permissions?: string[] | null
          joined_at?: string
        }
      }
      camp_grids: {
        Row: {
          trip_id: string
          width_ft: number
          height_ft: number
          cell_size_ft: number
          festival_preset: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          trip_id: string
          width_ft: number
          height_ft: number
          cell_size_ft?: number
          festival_preset?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          trip_id?: string
          width_ft?: number
          height_ft?: number
          cell_size_ft?: number
          festival_preset?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      camp_items: {
        Row: {
          id: string
          grid_id: string
          item_type: 'tent' | 'car' | 'table' | 'canopy' | 'fire_pit' | 'path' | 'custom'
          x: number
          y: number
          width_cells: number
          height_cells: number
          real_width_ft: number
          real_height_ft: number
          label: string | null
          assigned_to: string | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grid_id: string
          item_type: 'tent' | 'car' | 'table' | 'canopy' | 'fire_pit' | 'path' | 'custom'
          x: number
          y: number
          width_cells: number
          height_cells: number
          real_width_ft: number
          real_height_ft: number
          label?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          grid_id?: string
          item_type?: 'tent' | 'car' | 'table' | 'canopy' | 'fire_pit' | 'path' | 'custom'
          x?: number
          y?: number
          width_cells?: number
          height_cells?: number
          real_width_ft?: number
          real_height_ft?: number
          label?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supply_items: {
        Row: {
          id: string
          trip_id: string
          name: string
          quantity: number
          category: 'cooking' | 'shelter' | 'hygiene' | 'medical' | 'drinks' | 'food' | 'entertainment' | 'misc'
          status: 'unassigned' | 'claimed' | 'packed'
          claimed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          quantity?: number
          category: 'cooking' | 'shelter' | 'hygiene' | 'medical' | 'drinks' | 'food' | 'entertainment' | 'misc'
          status?: 'unassigned' | 'claimed' | 'packed'
          claimed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          quantity?: number
          category?: 'cooking' | 'shelter' | 'hygiene' | 'medical' | 'drinks' | 'food' | 'entertainment' | 'misc'
          status?: 'unassigned' | 'claimed' | 'packed'
          claimed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packing_items: {
        Row: {
          id: string
          trip_id: string
          name: string
          category: 'shelter' | 'festival_gear' | 'clothing' | 'hygiene' | 'medical' | 'kitchen' | 'comfort'
          is_group_item: boolean
          assigned_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          category: 'shelter' | 'festival_gear' | 'clothing' | 'hygiene' | 'medical' | 'kitchen' | 'comfort'
          is_group_item?: boolean
          assigned_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          category?: 'shelter' | 'festival_gear' | 'clothing' | 'hygiene' | 'medical' | 'kitchen' | 'comfort'
          is_group_item?: boolean
          assigned_to?: string | null
          created_at?: string
        }
      }
      packing_checks: {
        Row: {
          packing_item_id: string
          user_id: string
          packed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          packing_item_id: string
          user_id: string
          packed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          packing_item_id?: string
          user_id?: string
          packed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      safety_profiles: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          full_name: string | null
          phone: string | null
          hometown: string | null
          emergency_contact_name: string | null
          emergency_contact_relationship: string | null
          emergency_contact_phone: string | null
          allergies_food: string[] | null
          allergies_environmental: string[] | null
          allergies_medication: string[] | null
          current_medications: string[] | null
          blood_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          full_name?: string | null
          phone?: string | null
          hometown?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_phone?: string | null
          allergies_food?: string[] | null
          allergies_environmental?: string[] | null
          allergies_medication?: string[] | null
          current_medications?: string[] | null
          blood_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          full_name?: string | null
          phone?: string | null
          hometown?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_phone?: string | null
          allergies_food?: string[] | null
          allergies_environmental?: string[] | null
          allergies_medication?: string[] | null
          current_medications?: string[] | null
          blood_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          action_type: string
          module: string | null
          target_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          action_type: string
          module?: string | null
          target_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          action_type?: string
          module?: string | null
          target_id?: string | null
          description?: string
          created_at?: string
        }
      }
      budget_entries: {
        Row: {
          id: string
          trip_id: string
          paid_by: string
          amount_cents: number
          description: string
          category: 'food' | 'supplies' | 'fuel' | 'activity' | 'misc'
          split_type: 'equal' | 'custom'
          split_with: string[] | null
          custom_splits: Json | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          paid_by: string
          amount_cents: number
          description: string
          category: 'food' | 'supplies' | 'fuel' | 'activity' | 'misc'
          split_type?: 'equal' | 'custom'
          split_with?: string[] | null
          custom_splits?: Json | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          paid_by?: string
          amount_cents?: number
          description?: string
          category?: 'food' | 'supplies' | 'fuel' | 'activity' | 'misc'
          split_type?: 'equal' | 'custom'
          split_with?: string[] | null
          custom_splits?: Json | null
          receipt_url?: string | null
          created_at?: string
        }
      }
    }
  }
}
