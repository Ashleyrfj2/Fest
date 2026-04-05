/**
 * Collaboration Approval Queue Types
 * Defines shapes for change proposals and approval workflows
 */

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'stale';

export type ProposalActionType = 'create' | 'update' | 'delete';

/**
 * Normalized proposal payload shape
 * Used across all modules to maintain consistency
 */
export interface ProposalPayload {
  // Entity identification
  entityId?: string; // UUID of the entity being changed
  entityType?: string; // e.g. "meal", "supply_item", "vehicle", "budget_entry"

  // Change details
  field?: string; // field being changed (e.g. "cook_id", "quantity")
  oldValue?: unknown; // previous value
  newValue?: unknown; // proposed new value

  // Context
  reason?: string; // why this change is being proposed
  description?: string; // human-readable summary (max 200 chars)
  summary?: string; // alias for description

  // Additional metadata
  [key: string]: unknown;
}

/**
 * Change proposal row from database
 */
export interface ChangeProposal {
  id: string;
  trip_id: string;
  proposer_id: string;
  module_id: string; // e.g. "food", "camp", "supply", "travel", "lineup", "budget"
  target_entity_id: string | null;
  target_entity_type: string | null;
  action_type: ProposalActionType;
  payload: ProposalPayload;
  status: ProposalStatus;
  requested_at: string;
  resolved_at: string | null;
  resolver_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Change proposal with joined proposer user info
 */
export interface ChangeProposalWithProposer extends ChangeProposal {
  proposer?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  resolver?: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
}

/**
 * Input for creating a new proposal
 */
export interface CreateProposalInput {
  trip_id: string;
  module_id: string;
  target_entity_id?: string;
  target_entity_type?: string;
  action_type: ProposalActionType;
  payload: ProposalPayload;
}

/**
 * Input for resolving a proposal
 */
export interface ResolveProposalInput {
  proposal_id: string;
  status: 'approved' | 'rejected' | 'stale';
  notes?: string;
}

/**
 * Approval queue state
 */
export interface ApprovalQueueState {
  pending: ChangeProposalWithProposer[];
  approved: ChangeProposalWithProposer[];
  rejected: ChangeProposalWithProposer[];
  stale: ChangeProposalWithProposer[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Module-scoped approval state (for embedding in module-specific screens)
 */
export interface ModuleApprovalState {
  moduleName: string;
  pendingProposals: ChangeProposalWithProposer[];
  canPropose: boolean;
  canApprove: boolean;
  isLoading: boolean;
}
