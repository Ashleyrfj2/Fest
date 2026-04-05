/**
 * Approval Queue Utilities
 * Helper functions for working with proposals and approval workflows
 */

import { ChangeProposalWithProposer, ProposalPayload } from '@/lib/approvalQueueTypes';

/**
 * Format a proposal into a human-readable summary
 */
export function formatProposalSummary(proposal: ChangeProposalWithProposer): {
  title: string;
  description: string;
} {
  const { action_type, module_id, payload } = proposal;

  // Use description from payload if available
  if (payload.description || payload.summary) {
    return {
      title: (payload.description || payload.summary) as string,
      description: `${action_type} in ${module_id}`,
    };
  }

  // Build from action and module
  const title = `${capitalizeFirst(action_type)} ${payload.entityType || 'item'}`;
  const description = `${module_id}${payload.reason ? ` - ${payload.reason}` : ''}`;

  return { title, description };
}

/**
 * Get proposal status badge color
 */
export function getProposalStatusColor(
      status: 'pending' | 'approved' | 'rejected' | 'stale'
    ): { backgroundColor: string; color: string } {
      switch (status) {
        case 'pending':
          return { backgroundColor: '#FEF3C7', color: '#92400E' };
        case 'approved':
          return { backgroundColor: '#DCFCE7', color: '#166534' };
        case 'rejected':
          return { backgroundColor: '#FEE2E2', color: '#991B1B' };
        case 'stale':
          return { backgroundColor: '#F3F4F6', color: '#374151' };
        default:
          return { backgroundColor: '#F5F5F5', color: '#525252' };
      }
    }

/**
 * Get proposal status display text
 */
export function getProposalStatusLabel(
  status: 'pending' | 'approved' | 'rejected' | 'stale'
): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'stale':
      return 'Stale';
    default:
      return status;
  }
}

/**
 * Check if a proposal is resolved
 */
export function isProposalResolved(
  proposal: ChangeProposalWithProposer
): boolean {
  return proposal.status !== 'pending';
}

/**
 * Check if a proposal can be acted on by the current user
 */
export function canActOnProposal(
  proposal: ChangeProposalWithProposer,
  userIsLeader: boolean
): boolean {
  return userIsLeader && proposal.status === 'pending';
}

/**
 * Group proposals by module
 */
export function groupProposalsByModule(
  proposals: ChangeProposalWithProposer[]
): Map<string, ChangeProposalWithProposer[]> {
  const grouped = new Map<string, ChangeProposalWithProposer[]>();

  proposals.forEach((proposal) => {
    const module = proposal.module_id;
    if (!grouped.has(module)) {
      grouped.set(module, []);
    }
    grouped.get(module)!.push(proposal);
  });

  return grouped;
}

/**
 * Sort proposals by recency (newest first)
 */
export function sortProposalsByRecency(
  proposals: ChangeProposalWithProposer[]
): ChangeProposalWithProposer[] {
  return [...proposals].sort(
    (a, b) =>
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  );
}

/**
 * Helper to build a proposal payload
 */
export function buildProposalPayload(
  input: Partial<ProposalPayload>
): ProposalPayload {
  return {
    entityId: input.entityId,
    entityType: input.entityType,
    field: input.field,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason,
    description: input.description || input.summary,
    ...input,
  };
}

/**
 * Format timestamp for display
 */
export function formatProposalTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
