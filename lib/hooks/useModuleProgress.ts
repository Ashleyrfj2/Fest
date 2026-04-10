/**
 * Module Progress Aggregation Hook
 * Consumes module-specific data and calculates real trip progress
 * 
 * Coordinates progress from:
 * - Supply List
 * - Travel
 * - Packing
 * - Safety
 * 
 * And calculates overall trip completion percentage
 */

import { useEffect, useState, useCallback } from 'react';
import { ModuleProgress, TripProgress, calculateTripOverallPercent, getDefaultModuleProgress, validateModuleProgress } from '@/lib/progressTypes';
import { useSupplyList } from './useSupplyList';
import { useTravel } from './useTravel';
import { usePackingList } from './usePackingList';
import { useSafetyProfile } from './useSafetyProfile';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Hook to calculate real progress for all modules
 * Returns aggregated trip progress with per-module breakdown
 */
export function useModuleProgress(tripId: string, tripMembers: { user_id?: string; id?: string }[] = []) {
  const { userProfile } = useAuth();
  const [tripProgress, setTripProgress] = useState<TripProgress>({
    overallPercent: 0,
    moduleProgress: {},
    safetySelfComplete: false,
    includedCount: 0,
    implementedCount: 0,
    isLoading: true,
    anyErrors: false,
  });

  // Call each module hook
  const supplyList = useSupplyList(tripId);
  const travel = useTravel(tripId);
  const packing = usePackingList(tripId);
  const safety = useSafetyProfile(tripId);

  // Recalculate whenever module data changes
  useEffect(() => {
    calculateProgress();
  }, [supplyList.items, travel.vehicles, travel.flights, packing.items, safety.groupProfiles, tripMembers]);

  const calculateProgress = useCallback(() => {
    const memberCount = (tripMembers || []).length || 1;
    const moduleProgress: Record<string, ModuleProgress> = {};
    let includedCount = 0;
    let implementedCount = 0;
    let anyErrors = false;
    let safetySelfComplete = false;

    // =========================================================================
    // SUPPLY LIST PROGRESS
    // Formula: claimed_items / total_items
    // =========================================================================
    try {
      const totalItems = supplyList.items.length;
      const claimedItems = supplyList.items.filter(
        (item) => item.claimed_by || item.status === 'claimed' || item.status === 'packed'
      ).length;

      const supplyPercent = totalItems > 0 ? Math.round((claimedItems / totalItems) * 100) : 0;

      moduleProgress.supply_list = validateModuleProgress({
        moduleId: 'supply_list',
        moduleName: 'Supply List',
        current: claimedItems,
        total: totalItems,
        percent: supplyPercent,
        isImplemented: true,
        includeInAggregate: true,
        isLoading: supplyList.isLoading,
        error: supplyList.error || undefined,
      });

      includedCount++;
      implementedCount++;
    } catch (error) {
      console.error('Error calculating supply list progress:', error);
      moduleProgress.supply_list = getDefaultModuleProgress('supply_list', 'Supply List', true);
      moduleProgress.supply_list.error = 'Failed to calculate progress';
      anyErrors = true;
    }

    // =========================================================================
    // TRAVEL PROGRESS
    // Formula: assigned_passengers / trip_members
    // =========================================================================
    try {
      let assignedPassengers = new Set<string>();

      // Count unique passengers across all vehicles
      travel.vehicles.forEach((vehicle) => {
        if (vehicle.passengers) {
          vehicle.passengers.forEach((passenger) => {
            assignedPassengers.add(passenger.user_id);
          });
        }
      });

      // Also count flight users
      travel.flights.forEach((flight) => {
        if (flight.user_id) {
          assignedPassengers.add(flight.user_id);
        }
      });

      const travelPercent = memberCount > 0 ? Math.round((assignedPassengers.size / memberCount) * 100) : 0;

      moduleProgress.travel = validateModuleProgress({
        moduleId: 'travel',
        moduleName: 'Travel',
        current: assignedPassengers.size,
        total: memberCount,
        percent: travelPercent,
        isImplemented: true,
        includeInAggregate: true,
        isLoading: travel.isLoading,
        error: travel.error || undefined,
      });

      includedCount++;
      implementedCount++;
    } catch (error) {
      console.error('Error calculating travel progress:', error);
      moduleProgress.travel = getDefaultModuleProgress('travel', 'Travel', true);
      moduleProgress.travel.error = 'Failed to calculate progress';
      anyErrors = true;
    }

    // =========================================================================
    // PACKING PROGRESS
    // Formula: packed_items / tracked_items
    // =========================================================================
    try {
      const totalPackingItems = packing.items.length;
      const packedItems = packing.items.filter((item) => item.packed).length;

      const packingPercent = totalPackingItems > 0 ? Math.round((packedItems / totalPackingItems) * 100) : 0;

      moduleProgress.packing = validateModuleProgress({
        moduleId: 'packing',
        moduleName: 'Packing',
        current: packedItems,
        total: totalPackingItems,
        percent: packingPercent,
        isImplemented: true,
        includeInAggregate: true,
        isLoading: packing.isLoading,
        error: packing.error || undefined,
      });

      includedCount++;
      implementedCount++;
    } catch (error) {
      console.error('Error calculating packing progress:', error);
      moduleProgress.packing = getDefaultModuleProgress('packing', 'Packing', true);
      moduleProgress.packing.error = 'Failed to calculate progress';
      anyErrors = true;
    }

    // =========================================================================
    // SAFETY PROGRESS
    // Formula: complete_profiles / trip_members
    // =========================================================================
    try {
      // Count members with complete safety profiles
      // A complete profile has emergency contact info and medical info filled
      const completeProfiles = safety.groupProfiles.filter((profile) => {
        // Check if emergency contact is complete (at least name and phone)
        const hasEmergencyContact =
          profile.emergency_contact_name &&
          profile.emergency_contact_name.trim().length > 0 &&
          profile.emergency_contact_phone &&
          profile.emergency_contact_phone.trim().length > 0;

        // Check if medical info is complete (at least blood type or medications or notes)
        const hasMedicalInfo =
          (profile.blood_type && profile.blood_type.trim().length > 0) ||
          (profile.current_medications && profile.current_medications.length > 0) ||
          (profile.notes && profile.notes.trim().length > 0);

        return hasEmergencyContact && hasMedicalInfo;
      }).length;

      const currentUserSafetyProfile = userProfile?.id
        ? safety.groupProfiles.find((profile) => profile.user_id === userProfile.id)
        : null;
      const currentUserHasEmergencyContact = Boolean(
        currentUserSafetyProfile?.emergency_contact_name?.trim() &&
          currentUserSafetyProfile?.emergency_contact_phone?.trim()
      );
      const currentUserHasMedicalInfo = Boolean(
        currentUserSafetyProfile?.blood_type?.trim() ||
          currentUserSafetyProfile?.current_medications?.length ||
          currentUserSafetyProfile?.notes?.trim()
      );
      safetySelfComplete = Boolean(currentUserHasEmergencyContact && currentUserHasMedicalInfo);

      const safetyPercent = memberCount > 0 ? Math.round((completeProfiles / memberCount) * 100) : 0;

      moduleProgress.safety = validateModuleProgress({
        moduleId: 'safety',
        moduleName: 'Safety',
        current: completeProfiles,
        total: memberCount,
        percent: safetyPercent,
        isImplemented: true,
        includeInAggregate: true,
        isLoading: safety.loading,
        error: safety.error || undefined,
      });

      includedCount++;
      implementedCount++;
    } catch (error) {
      console.error('Error calculating safety progress:', error);
      moduleProgress.safety = getDefaultModuleProgress('safety', 'Safety', true);
      moduleProgress.safety.error = 'Failed to calculate progress';
      anyErrors = true;
    }

    // =========================================================================
    // COLLABORATION (implemented, excluded from aggregate)
    // =========================================================================
    moduleProgress.collaboration = getDefaultModuleProgress('collaboration', 'Collaboration', true);
    moduleProgress.collaboration.includeInAggregate = false;
    implementedCount++;

    // =========================================================================
    // FOOD PLANNER (coming soon, not implemented)
    // =========================================================================
    moduleProgress.food = getDefaultModuleProgress('food', 'Food Planner', false);
    moduleProgress.food.includeInAggregate = false;

    // =========================================================================
    // LINEUP (coming soon, not implemented)
    // =========================================================================
    moduleProgress.lineup = getDefaultModuleProgress('lineup', 'Lineup', false);
    moduleProgress.lineup.includeInAggregate = false;

    // =========================================================================
    // BUDGET (not yet defined)
    // =========================================================================
    moduleProgress.budget = getDefaultModuleProgress('budget', 'Budget', false);
    moduleProgress.budget.includeInAggregate = false;

    // Calculate overall completion percentage
    const overallPercent = calculateTripOverallPercent(moduleProgress);

    // Update state
    setTripProgress({
      overallPercent,
      moduleProgress,
      safetySelfComplete,
      includedCount,
      implementedCount,
      isLoading: supplyList.isLoading || travel.isLoading || packing.isLoading || safety.loading,
      anyErrors,
    });
  }, [supplyList.items, travel.vehicles, travel.flights, packing.items, safety.groupProfiles, tripMembers.length, userProfile?.id]);

  return tripProgress;
}

/**
 * Helper to get progress for a specific module
 */
export function getModuleProgress(
  tripProgress: TripProgress,
  moduleId: string
): ModuleProgress | undefined {
  return tripProgress.moduleProgress[moduleId];
}
