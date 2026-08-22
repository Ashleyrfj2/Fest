export type ApprovalRole = 'leader' | 'editor' | 'viewer' | string | null | undefined;

/**
 * Mirrors the server-side can_edit_module rule for UI affordances.
 * RLS remains the authority; this prevents the UI from advertising actions
 * to viewers or editors without the requested module permission.
 */
export function canProposeForModule(
  role: ApprovalRole,
  modulePermissions: readonly string[] | null | undefined,
  moduleName: string
): boolean {
  if (!moduleName || (role !== 'leader' && role !== 'editor')) {
    return false;
  }

  return role === 'leader'
    || modulePermissions == null
    || modulePermissions.length === 0
    || modulePermissions.includes(moduleName);
}

export function validateProposalTripScope(
  inputTripId: string,
  activeTripId: string
): string | null {
  if (!inputTripId || !activeTripId) {
    return 'A valid active trip is required';
  }

  if (inputTripId !== activeTripId) {
    return 'Proposal trip does not match the active trip';
  }

  return null;
}
