import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Check, X, AlertCircle, Clock } from 'lucide-react-native';
import { ChangeProposalWithProposer } from '@/lib/approvalQueueTypes';
import {
  formatProposalSummary,
  getProposalStatusColor,
  getProposalStatusLabel,
  formatProposalTime,
  canActOnProposal,
} from '@/lib/approvalQueueUtils';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface ApprovalQueueProps {
  proposals: ChangeProposalWithProposer[];
  isLoading?: boolean;
  onApprove?: (proposalId: string, notes?: string) => Promise<void>;
  onReject?: (proposalId: string, notes?: string) => Promise<void>;
  userIsLeader?: boolean;
  moduleName?: string; // Optional: filter by module
}

export function ApprovalQueuePanel({
  proposals,
  isLoading = false,
  onApprove,
  onReject,
  userIsLeader = false,
  moduleName,
}: ApprovalQueueProps) {
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter by module if specified
  const filtered = moduleName
    ? proposals.filter((p) => p.module_id === moduleName)
    : proposals;

  const pending = filtered.filter((p) => p.status === 'pending');
  const resolved = filtered.filter((p) => p.status !== 'pending');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (pending.length === 0 && resolved.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No proposals yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Pending Proposals */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending ({pending.length})
          </Text>
          {pending.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isExpanded={expandedId === proposal.id}
              isActing={actingOnId === proposal.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === proposal.id ? null : proposal.id)
              }
              onApprove={
                userIsLeader &&
                canActOnProposal(proposal, userIsLeader) &&
                onApprove
                  ? async () => {
                      setActingOnId(proposal.id);
                      try {
                        await onApprove(proposal.id);
                      } finally {
                        setActingOnId(null);
                      }
                    }
                  : undefined
              }
              onReject={
                userIsLeader &&
                canActOnProposal(proposal, userIsLeader) &&
                onReject
                  ? async () => {
                      setActingOnId(proposal.id);
                      try {
                        await onReject(proposal.id);
                      } finally {
                        setActingOnId(null);
                      }
                    }
                  : undefined
              }
            />
          ))}
        </View>
      )}

      {/* Resolved Proposals */}
      {resolved.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Resolved ({resolved.length})
          </Text>
          {resolved.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isExpanded={expandedId === proposal.id}
              isActing={false}
              onToggleExpand={() =>
                setExpandedId(expandedId === proposal.id ? null : proposal.id)
              }
              onApprove={undefined}
              onReject={undefined}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

interface ProposalCardProps {
  proposal: ChangeProposalWithProposer;
  isExpanded: boolean;
  isActing: boolean;
  onToggleExpand: () => void;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
}

function ProposalCard({
  proposal,
  isExpanded,
  isActing,
  onToggleExpand,
  onApprove,
  onReject,
}: ProposalCardProps) {
  const { title, description } = formatProposalSummary(proposal);
  const statusLabel = getProposalStatusLabel(proposal.status);
  const statusColor = getProposalStatusColor(proposal.status);
  const timeAgo = formatProposalTime(proposal.requested_at);

  return (
    <View
      style={[
        styles.card,
        proposal.status === 'pending'
          ? styles.cardPending
          : styles.cardResolved,
      ]}
    >
      {/* Header */}
      <Pressable
        style={styles.cardHeader}
        onPress={onToggleExpand}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIcon}>
            {proposal.status === 'pending' ? (
              <Clock width={16} height={16} color={colors.warning} />
            ) : proposal.status === 'approved' ? (
              <Check width={16} height={16} color={colors.success} />
            ) : proposal.status === 'rejected' ? (
              <X width={16} height={16} color={colors.danger} />
            ) : (
              <AlertCircle
                width={16}
                height={16}
                color={colors.text.secondary}
              />
            )}
          </View>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        <Text style={[styles.statusBadge, statusColor]}>
          {statusLabel}
        </Text>
      </Pressable>

      {/* Proposer Info */}
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          Proposed by {proposal.proposer?.display_name || 'Unknown'} {timeAgo}
        </Text>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.cardDetails}>
          {proposal.payload.reason && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Reason</Text>
              <Text style={styles.detailValue}>
                {proposal.payload.reason}
              </Text>
            </View>
          )}

          {proposal.payload.field && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Change</Text>
              <Text style={styles.detailValue}>
                {proposal.payload.field}: {String(proposal.payload.oldValue)} →{' '}
                {String(proposal.payload.newValue)}
              </Text>
            </View>
          )}

          {proposal.status !== 'pending' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>
                {proposal.status === 'approved' ? 'Approved' : 'Resolved'} by
              </Text>
              <Text style={styles.detailValue}>
                {proposal.resolver?.display_name || 'Unknown'}
              </Text>
              {proposal.notes && (
                <Text style={styles.detailNote}>{proposal.notes}</Text>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {onApprove || onReject ? (
            <View style={styles.actionButtons}>
              {onApprove && (
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.approveButton,
                    isActing && styles.actionButtonDisabled,
                  ]}
                  onPress={onApprove}
                  disabled={isActing}
                >
                  {isActing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Check width={16} height={16} color="white" />
                      <Text style={styles.buttonText}>Approve</Text>
                    </>
                  )}
                </Pressable>
              )}

              {onReject && (
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.rejectButton,
                    isActing && styles.actionButtonDisabled,
                  ]}
                  onPress={onReject}
                  disabled={isActing}
                >
                  {isActing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <X width={16} height={16} color="white" />
                      <Text style={styles.buttonText}>Reject</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.level1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPending: {
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.level2,
  },
  cardResolved: {
    borderColor: colors.border.medium,
    backgroundColor: colors.text.secondary[50],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface.level1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardMeta: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  detailNote: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface.level1,
    fontSize: 13,
    fontWeight: '600',
  },
});
