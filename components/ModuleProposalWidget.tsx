import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Plus, Send } from 'lucide-react-native';
import { useCollaboration } from '@/lib/hooks/useCollaboration';
import { CreateProposalInput, ProposalPayload } from '@/lib/approvalQueueTypes';
import {
  formatProposalSummary,
  formatProposalTime,
} from '@/lib/approvalQueueUtils';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface ModuleProposalWidgetProps {
  tripId: string;
  moduleName: string; // e.g. "food", "camp", "supply"
  userCanPropose: boolean;
  onProposalCreated?: () => void;
}

/**
 * Widget for managing proposals within a specific module
 * Shows pending proposals and allows creation of new ones
 */
export function ModuleProposalWidget({
  tripId,
  moduleName,
  userCanPropose,
  onProposalCreated,
}: ModuleProposalWidgetProps) {
  const { getPendingProposalsForModule, createProposal } =
    useCollaboration(tripId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const pendingProposals = getPendingProposalsForModule(moduleName);

  const handleCreateProposal = useCallback(
    async (input: CreateProposalInput) => {
      setIsCreating(true);
      try {
        const { error } = await createProposal(input);
        if (!error) {
          setShowCreateModal(false);
          onProposalCreated?.();
        }
      } finally {
        setIsCreating(false);
      }
    },
    [createProposal, onProposalCreated]
  );

  if (pendingProposals.length === 0 && !userCanPropose) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        {/* Pending Proposals Banner */}
        {pendingProposals.length > 0 && (
          <View style={[styles.banner, styles.bannerPending]}>
            <Text style={styles.bannerIcon}>⏳</Text>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                {pendingProposals.length} pending{' '}
                {pendingProposals.length === 1 ? 'proposal' : 'proposals'}
              </Text>
              <Text style={styles.bannerText}>
                Awaiting leader approval
              </Text>
            </View>
          </View>
        )}

        {/* Pending Proposals List */}
        {pendingProposals.length > 0 && (
          <View style={styles.proposalsList}>
            {pendingProposals.map((proposal) => {
              const { title } = formatProposalSummary(proposal);
              const timeAgo = formatProposalTime(proposal.requested_at);
              return (
                <View key={proposal.id} style={styles.proposalItem}>
                  <Text style={styles.proposalTitle}>{title}</Text>
                  <Text style={styles.proposalTime}>
                    Proposed {timeAgo} by{' '}
                    {proposal.proposer?.display_name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Create Proposal Button */}
        {userCanPropose && (
          <Pressable
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus
              width={18}
              height={18}
              color={colors.surface.level1}
            />
            <Text style={styles.createButtonText}>
              Propose Change
            </Text>
          </Pressable>
        )}
      </View>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        visible={showCreateModal}
        tripId={tripId}
        moduleName={moduleName}
        isCreating={isCreating}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProposal}
      />
    </>
  );
}

interface CreateProposalModalProps {
  visible: boolean;
  tripId: string;
  moduleName: string;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProposalInput) => Promise<void>;
}

function CreateProposalModal({
  visible,
  tripId,
  moduleName,
  isCreating,
  onClose,
  onSubmit,
}: CreateProposalModalProps) {
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [field, setField] = useState('');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    const payload: ProposalPayload = {
      description: description.trim(),
      reason: reason.trim() || undefined,
      field: field.trim() || undefined,
      oldValue: oldValue.trim() || undefined,
      newValue: newValue.trim() || undefined,
    };

    await onSubmit({
      trip_id: tripId,
      module_id: moduleName,
      action_type: 'update',
      payload,
    });

    // Clear form
    setDescription('');
    setReason('');
    setField('');
    setOldValue('');
    setNewValue('');
  }, [description, reason, field, oldValue, newValue, onSubmit, tripId, moduleName]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Propose Change</Text>
          <Pressable onPress={onClose} disabled={isCreating}>
            <Text
              style={[
                styles.modalCloseButton,
                isCreating && styles.modalCloseButtonDisabled,
              ]}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
        >
          <Text style={styles.fieldLabel}>What are you proposing?*</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Change meal to vegan option"
            placeholderTextColor={colors.text.secondary[400]}
            value={description}
            onChangeText={setDescription}
            editable={!isCreating}
            multiline
          />

          <Text style={styles.fieldLabel}>Why? (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputSmall]}
            placeholder="e.g., Dietary preference change"
            placeholderTextColor={colors.text.secondary[400]}
            value={reason}
            onChangeText={setReason}
            editable={!isCreating}
          />

          <Text style={styles.fieldLabel}>Field changing (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputSmall]}
            placeholder="e.g., meal_type"
            placeholderTextColor={colors.text.secondary[400]}
            value={field}
            onChangeText={setField}
            editable={!isCreating}
          />

          <Text style={styles.fieldLabel}>Old value (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputSmall]}
            placeholder="e.g., chicken"
            placeholderTextColor={colors.text.secondary[400]}
            value={oldValue}
            onChangeText={setOldValue}
            editable={!isCreating}
          />

          <Text style={styles.fieldLabel}>New value (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputSmall]}
            placeholder="e.g., vegan"
            placeholderTextColor={colors.text.secondary[400]}
            value={newValue}
            onChangeText={setNewValue}
            editable={!isCreating}
          />

          <Text style={styles.helpText}>
            Your proposal will be sent to the trip leader for approval.
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <Pressable
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
            disabled={isCreating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[
              styles.modalButton,
              styles.submitButton,
              isCreating && styles.submitButtonLoading,
            ]}
            onPress={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator
                size="small"
                color={colors.surface.level1}
              />
            ) : (
              <>
                <Send
                  width={16}
                  height={16}
                  color={colors.surface.level1}
                />
                <Text style={styles.submitButtonText}>
                  Send Proposal
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerPending: {
    backgroundColor: colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  bannerIcon: {
    fontSize: 20,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning[900],
  },
  bannerText: {
    fontSize: 12,
    color: colors.warning[700],
    marginTop: 2,
  },
  proposalsList: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.warning[50],
    borderRadius: 8,
    gap: 8,
  },
  proposalItem: {
    paddingBottom: 8,
  },
  proposalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning[900],
  },
  proposalTime: {
    fontSize: 11,
    color: colors.warning[700],
    marginTop: 2,
  },
  createButton: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.accent.gold[600],
    borderRadius: 10,
  },
  createButtonText: {
    color: colors.surface.level1,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface.level1,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.secondary[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary[900],
  },
  modalCloseButton: {
    fontSize: 24,
    color: colors.text.secondary[400],
    paddingHorizontal: 12,
  },
  modalCloseButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary[900],
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.text.secondary[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary[900],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputSmall: {
    minHeight: 40,
  },
  helpText: {
    fontSize: 12,
    color: colors.text.secondary[500],
    marginTop: 16,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.text.secondary[200],
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.text.secondary[100],
    borderWidth: 1,
    borderColor: colors.text.secondary[300],
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary[900],
  },
  submitButton: {
    backgroundColor: colors.accent.gold[600],
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface.level1,
  },
});
