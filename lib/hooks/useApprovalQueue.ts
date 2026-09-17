import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ChangeProposal,
  ChangeProposalWithProposer,
  ProposalStatus,
  CreateProposalInput,
  ResolveProposalInput,
  ApprovalQueueState,
  ProposalPayload,
} from '@/lib/approvalQueueTypes';
import {
  canProposeForModule,
  validateProposalTripScope,
} from '@/lib/approvalQueueValidation';

/**
 * Hook for managing collaboration approval queue
 * Handles proposal CRUD and real-time subscriptions
 */
export function useApprovalQueue(
  tripId: string,
  currentUserRole?: string | null,
  currentUserModulePermissions?: readonly string[] | null
) {
  const { userProfile } = useAuth();
  const [proposals, setProposals] = useState<ChangeProposalWithProposer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all proposals for the trip with user info
  const fetchProposals = useCallback(async () => {
    if (!tripId) return;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('change_proposals')
        .select(
          `
          *,
          proposer:proposer_id(id, display_name, avatar_color),
          resolver:resolver_id(id, display_name, avatar_color)
          `
        )
        .eq('trip_id', tripId)
        .order('requested_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Normalize the proposer/resolver data (Supabase returns arrays)
      const normalized = (data || []).map((proposal: any) => ({
        ...proposal,
        proposer: Array.isArray(proposal.proposer) ? proposal.proposer[0] : proposal.proposer,
        resolver: Array.isArray(proposal.resolver) ? proposal.resolver[0] : proposal.resolver,
      }));

      setProposals(normalized);
    } catch (err) {
      console.error('Error fetching approval queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!tripId) return;

    fetchProposals();

    const channel = supabase
      .channel(`change_proposals:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'change_proposals',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void fetchProposals();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to approval queue updates');
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchProposals, tripId]);

  // Create a new proposal
  const createProposal = useCallback(
    async (input: CreateProposalInput) => {
      if (!userProfile?.id) {
        return { error: 'You must be signed in to propose changes' };
      }

      const scopeError = validateProposalTripScope(input.trip_id, tripId);
      if (scopeError) {
        return { error: scopeError };
      }

      try {
        const { data, error: insertError } = await supabase
          .from('change_proposals')
          .insert({
            trip_id: input.trip_id,
            proposer_id: userProfile.id,
            module_id: input.module_id,
            target_entity_id: input.target_entity_id || null,
            target_entity_type: input.target_entity_type || null,
            action_type: input.action_type,
            payload: input.payload,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return { data: data as ChangeProposal, error: null };
      } catch (err) {
        console.error('Error creating proposal:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to create proposal',
          data: null,
        };
      }
    },
    [userProfile?.id]
  );

  // Approve a proposal (leader only)
  const approveProposal = useCallback(
    async (proposalId: string, notes?: string) => {
      if (!userProfile?.id) {
        return { error: 'You must be signed in to approve proposals' };
      }

      try {
        const { error: updateError } = await supabase
          .from('change_proposals')
          .update({
            status: 'approved',
            resolver_id: userProfile.id,
            resolved_at: new Date().toISOString(),
            notes: notes || null,
          })
          .eq('id', proposalId);

        if (updateError) throw updateError;

        return { error: null };
      } catch (err) {
        console.error('Error approving proposal:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to approve proposal',
        };
      }
    },
    [userProfile?.id]
  );

  // Reject a proposal (leader only)
  const rejectProposal = useCallback(
    async (proposalId: string, notes?: string) => {
      if (!userProfile?.id) {
        return { error: 'You must be signed in to reject proposals' };
      }

      try {
        const { error: updateError } = await supabase
          .from('change_proposals')
          .update({
            status: 'rejected',
            resolver_id: userProfile.id,
            resolved_at: new Date().toISOString(),
            notes: notes || null,
          })
          .eq('id', proposalId);

        if (updateError) throw updateError;

        return { error: null };
      } catch (err) {
        console.error('Error rejecting proposal:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to reject proposal',
        };
      }
    },
    [userProfile?.id]
  );

  // Mark a proposal as stale (conflict detected)
  const markProposalStale = useCallback(
    async (proposalId: string, notes?: string) => {
      if (!userProfile?.id) {
        return { error: 'You must be signed in to mark proposals as stale' };
      }

      try {
        const { error: updateError } = await supabase
          .from('change_proposals')
          .update({
            status: 'stale',
            resolver_id: userProfile.id,
            resolved_at: new Date().toISOString(),
            notes: notes || 'Entity changed before proposal resolution',
          })
          .eq('id', proposalId);

        if (updateError) throw updateError;

        return { error: null };
      } catch (err) {
        console.error('Error marking proposal stale:', err);
        return {
          error: err instanceof Error ? err.message : 'Failed to mark proposal as stale',
        };
      }
    },
    [userProfile?.id]
  );

  // Filter proposals by status
  const proposalsByStatus = useMemo(() => {
    return {
      pending: proposals.filter((p) => p.status === 'pending'),
      approved: proposals.filter((p) => p.status === 'approved'),
      rejected: proposals.filter((p) => p.status === 'rejected'),
      stale: proposals.filter((p) => p.status === 'stale'),
    };
  }, [proposals]);

  // Filter proposals by module
  const proposalsByModule = useCallback(
    (moduleName: string) => proposals.filter((p) => p.module_id === moduleName),
    [proposals]
  );

  // Get pending proposals for a specific module
  const getPendingProposalsForModule = useCallback(
    (moduleName: string) => proposals.filter((p) => p.module_id === moduleName && p.status === 'pending'),
    [proposals]
  );

  // Check if user can propose (editor or leader)
  const canUserPropose = useCallback(
    (moduleName: string) => {
      return Boolean(
        userProfile?.id
          && canProposeForModule(
            currentUserRole,
            currentUserModulePermissions,
            moduleName
          )
      );
    },
    [currentUserModulePermissions, currentUserRole, userProfile?.id]
  );

  return {
    // State
    proposals,
    proposalsByStatus,
    isLoading,
    error,

    // Actions
    createProposal,
    approveProposal,
    rejectProposal,
    markProposalStale,

    // Filters
    proposalsByModule,
    getPendingProposalsForModule,

    // Permissions
    canUserPropose,

    // Refresh
    refresh: fetchProposals,
  };
}
