/**
 * Progress Contract
 * Shared interface for all modules to report completion metrics
 * 
 * This contract ensures consistent progress calculations across all modules
 * and prevents math from diverging between screens.
 */

/**
 * Module Progress Metric
 * Represents the completion state of a module
 */
export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  
  // Core metrics (all modules must provide these if they have a progress metric)
  current: number;      // Items completed/done
  total: number;        // Total items to complete
  percent: number;      // Percentage (0-100)
  
  // Metadata
  isImplemented: boolean;           // Is the module built?
  includeInAggregate: boolean;      // Should this count toward overall completion?
  isLoading: boolean;
  error?: string;
}

/**
 * Aggregated Trip Progress
 * High-level overview of trip readiness
 */
export interface TripProgress {
  // Overall metrics
  overallPercent: number;           // Simple average of included modules (0-100)
  
  // Individual module progress
  moduleProgress: Record<string, ModuleProgress>;
  
  // Module-specific helpers
  safetySelfComplete: boolean;      // Whether the current user's profile is complete
  
  // Metadata
  includedCount: number;            // Number of modules in aggregate
  implementedCount: number;         // Number of implemented modules
  isLoading: boolean;
  anyErrors: boolean;
}

/**
 * Module Progress Formulas
 * 
 * Each module contributes to progress differently:
 * 
 * Supply List: claimed_items / total_items
 *   - Counts items that have been claimed (moved to "claimed" or "packed" state)
 *   - Excludes unassigned items
 * 
 * Travel: assigned_passengers / trip_members
 *   - Counts unique members who have assigned themselves to a vehicle
 *   - Denominator is total trip members
 * 
 * Packing: packed_items / tracked_items
 *   - Counts items marked as packed for the current user
 *   - Only counts items tracked in packing_items
 * 
 * Safety: complete_profiles / trip_members
 *   - Counts members who have filled out all required safety fields
 *   - Excludes profiles with null/empty emergency_contact or medical_info
 * 
 * Food Planner: filled_slots / total_slots
 *   - Not yet implemented (module in progress)
 *   - Excluded from aggregate until ready
 * 
 * Collaboration & Budget: Excluded
 *   - Collaboration has no meaningful user-completion metric
 *   - Budget requires user-progress metric definition
 * 
 * Lineup: Coming soon (excluded)
 *   - Not yet implemented
 */

/**
 * Safe defaults for modules
 * Used when a module fails to load or is not yet implemented
 */
export function getDefaultModuleProgress(
  moduleId: string,
  moduleName: string,
  isImplemented: boolean
): ModuleProgress {
  return {
    moduleId,
    moduleName,
    current: 0,
    total: 0,
    percent: 0,
    isImplemented,
    includeInAggregate: false,
    isLoading: false,
    error: undefined,
  };
}

/**
 * Calculate overall trip percentage
 * Simple average of included modules
 */
export function calculateTripOverallPercent(
  moduleProgress: Record<string, ModuleProgress>
): number {
  const included = Object.values(moduleProgress).filter((m) => m.includeInAggregate);
  
  if (included.length === 0) {
    return 0;
  }
  
  const sum = included.reduce((acc, m) => acc + m.percent, 0);
  return Math.round(sum / included.length);
}

/**
 * Validate module progress (prevent invalid data)
 */
export function validateModuleProgress(progress: ModuleProgress): ModuleProgress {
  return {
    ...progress,
    current: Math.max(0, Math.min(progress.total, progress.current)),
    total: Math.max(0, progress.total),
    percent: Math.max(0, Math.min(100, progress.percent)),
  };
}
