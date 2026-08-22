import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useApprovalQueue } from '@/lib/hooks/useApprovalQueue';
import { ChangeProposalWithProposer } from '@/lib/approvalQueueTypes';

type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type Role = GroupMemberRow['role'];

type JoinedMember = GroupMemberRow & {
  user: Pick<UserRow, 'id' | 'display_name' | 'avatar_color'> | null;
};

export function useCollaboration(tripId: string) {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState<JoinedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserRole = useMemo<Role | null>(() => {
    if (!userProfile?.id) return null;
    return members.find((member) => member.user_id === userProfile.id)?.role ?? null;
  }, [members, userProfile?.id]);

  const currentUserModulePermissions = useMemo(
    () => members.find((member) => member.user_id === userProfile?.id)?.module_permissions ?? null,
    [members, userProfile?.id]
  );

  // Wire in the approval queue with the same role/permission context used by
  // the collaboration UI. Database RLS remains the final authorization gate.
  const approvalQueue = useApprovalQueue(
    tripId,
    currentUserRole,
    currentUserModulePermissions
  );

  const isLeader = currentUserRole === 'leader';

  const fetchMembers = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select('user_id, trip_id, role, module_permissions, joined_at, user:users(id, display_name, avatar_color)')
        .eq('trip_id', tripId)
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;

      const normalized = ((data ?? []) as Array<JoinedMember & {
        user?: JoinedMember['user'][] | JoinedMember['user'];
      }>).map((member) => ({
        ...member,
        user: Array.isArray(member.user) ? member.user[0] ?? null : member.user ?? null,
      }));

      setMembers(normalized);
    } catch (err) {
      console.error('Error fetching collaboration members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load crew');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const logActivity = useCallback(
    async (actionType: string, description: string, targetId?: string) => {
      if (!userProfile?.id) return;

      const { error: logError } = await supabase.from('activity_logs').insert({
        trip_id: tripId,
        user_id: userProfile.id,
        action_type: actionType,
        module: 'collaboration',
        target_id: targetId ?? null,
        description,
      });

      if (logError) {
        console.error('Error logging collaboration activity:', logError);
      }
    },
    [tripId, userProfile?.id]
  );

  useEffect(() => {
    fetchMembers();

    const channel = supabase
      .channel(`group_members:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void fetchMembers();
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchMembers, tripId]);

  const updateRole = useCallback(
    async (userId: string, newRole: Role) => {
      if (!isLeader) {
        return { error: 'Only the trip leader can update roles' };
      }

      if (!userProfile?.id) {
        return { error: 'You must be signed in to manage roles' };
      }

      if (userId === userProfile.id && newRole !== 'leader') {
        return { error: 'Use transfer leadership to change your own leader role' };
      }

      const targetMember = members.find((member) => member.user_id === userId);

      try {
        const { error: updateError } = await supabase
          .from('group_members')
          .update({ role: newRole })
          .eq('trip_id', tripId)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        await logActivity(
          'role_changed',
          `Updated ${targetMember?.user?.display_name ?? 'crew member'} to ${newRole}`,
          userId
        );

        return { error: null };
      } catch (err) {
        console.error('Error updating member role:', err);
        return { error: err instanceof Error ? err.message : 'Failed to update role' };
      }
    },
    [isLeader, logActivity, members, tripId, userProfile?.id]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (!isLeader) {
        return { error: 'Only the trip leader can remove members' };
      }

      if (!userProfile?.id) {
        return { error: 'You must be signed in to remove members' };
      }

      if (userId === userProfile.id) {
        return { error: 'Leader cannot remove themselves from the trip' };
      }

      const targetMember = members.find((member) => member.user_id === userId);

      try {
        const { error: deleteError } = await supabase
          .from('group_members')
          .delete()
          .eq('trip_id', tripId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        await logActivity(
          'member_removed',
          `Removed ${targetMember?.user?.display_name ?? 'crew member'} from trip`,
          userId
        );

        return { error: null };
      } catch (err) {
        console.error('Error removing member:', err);
        return { error: err instanceof Error ? err.message : 'Failed to remove member' };
      }
    },
    [isLeader, logActivity, members, tripId, userProfile?.id]
  );

  const transferLeadership = useCallback(
    async (userId: string) => {
      if (!isLeader) {
        return { error: 'Only the trip leader can transfer leadership' };
      }

      if (!userProfile?.id) {
        return { error: 'You must be signed in to transfer leadership' };
      }

      if (userId === userProfile.id) {
        return { error: 'Select a different member to transfer leadership' };
      }

      const newLeader = members.find((member) => member.user_id === userId);

      if (!newLeader) {
        return { error: 'That member is not part of this trip' };
      }

      try {
        const { error: transferError } = await supabase.rpc('transfer_trip_leadership', {
          p_trip_id: tripId,
          p_new_leader_id: userId,
        });

        if (transferError) throw transferError;

        // The RPC is authoritative. Refresh the membership projection after
        // commit so the caller no longer relies on the pre-transfer role list.
        await fetchMembers();

        return { error: null };
      } catch (err) {
        console.error('Error transferring leadership:', err);
        return { error: err instanceof Error ? err.message : 'Failed to transfer leadership' };
      }
    },
    [fetchMembers, isLeader, members, tripId, userProfile?.id]
  );

  const setModuleLead = useCallback(
    async (moduleId: string, userId: string | null) => {
      if (!isLeader) {
        return { error: 'Only the trip leader can assign module leads' };
      }

      if (!userProfile?.id) {
        return { error: 'You must be signed in to assign module leads' };
      }

      try {
        const updates = members
          .filter((member) => member.role !== 'leader')
          .map((member) => {
            const currentPermissions = member.module_permissions ?? [];
            const withoutModule = currentPermissions.filter((permission) => permission !== moduleId);
            const nextPermissions = userId && member.user_id === userId
              ? [...withoutModule, moduleId]
              : withoutModule;

            const unchanged =
              currentPermissions.length === nextPermissions.length &&
              currentPermissions.every((permission) => nextPermissions.includes(permission));

            if (unchanged) {
              return null;
            }

            return supabase
              .from('group_members')
              .update({ module_permissions: nextPermissions.length > 0 ? nextPermissions : null })
              .eq('trip_id', tripId)
              .eq('user_id', member.user_id);
          })
          .filter(Boolean);

        if (updates.length > 0) {
          const results = await Promise.all(updates);
          const firstError = results.find((result) => result?.error)?.error;
          if (firstError) throw firstError;
        }

        const assignedMember = members.find((member) => member.user_id === userId);
        await logActivity(
          'module_lead_updated',
          userId
            ? `Assigned ${assignedMember?.user?.display_name ?? 'crew member'} as ${moduleId} lead`
            : `Cleared ${moduleId} lead assignment`,
          userId ?? undefined
        );

        return { error: null };
      } catch (err) {
        console.error('Error setting module lead:', err);
        return { error: err instanceof Error ? err.message : 'Failed to set module lead' };
      }
    },
    [isLeader, logActivity, members, tripId, userProfile?.id]
  );

  return {
    // Members
    members,
    currentUserRole,
    isLeader,

    // Approval Queue
    approvalQueue: approvalQueue.proposalsByStatus.pending,
    allProposals: approvalQueue.proposals,
    proposalsByStatus: approvalQueue.proposalsByStatus,
    createProposal: approvalQueue.createProposal,
    approveProposal: approvalQueue.approveProposal,
    rejectProposal: approvalQueue.rejectProposal,
    markProposalStale: approvalQueue.markProposalStale,
    getPendingProposalsForModule: approvalQueue.getPendingProposalsForModule,
    canUserPropose: approvalQueue.canUserPropose,

    // State
    isLoading: isLoading || approvalQueue.isLoading,
    error: error || approvalQueue.error,
    hasApprovalQueueTable: true,

    // Actions
    updateRole,
    removeMember,
    transferLeadership,
    setModuleLead,
    refetch: fetchMembers,
    refreshApprovalQueue: approvalQueue.refresh,
  };
}
