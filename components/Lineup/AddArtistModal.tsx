/**
 * AddArtistModal Component
 * Form for manually adding artists to the lineup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';

interface AddArtistFormData {
  name: string;
  stage?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  genre?: string;
}

interface AddArtistModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (data: AddArtistFormData) => Promise<void>;
  isLoading?: boolean;
}

const STAGE_OPTIONS = ['Main Stage', 'Techno Forest', 'Sherwood Court', 'Jubilee', 'Hangar', 'Other'];
const DAY_OPTIONS = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'];
const GENRE_OPTIONS = ['Electronic', 'House', 'Techno', 'Psytrance', 'Indie', 'Hip-Hop', 'Pop', 'Other'];

export function AddArtistModal({ isVisible, onClose, onAdd, isLoading = false }: AddArtistModalProps) {
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [genre, setGenre] = useState('');
  const [stageOpen, setStageOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an artist name');
      return;
    }

    try {
      await onAdd({
        name: name.trim(),
        stage: stage || undefined,
        day: day || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        genre: genre || undefined,
      });

      // Reset form
      setName('');
      setStage('');
      setDay('');
      setStartTime('');
      setEndTime('');
      setGenre('');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add artist';
      Alert.alert('Error', message);
    }
  };

  const handleClose = () => {
    setName('');
    setStage('');
    setDay('');
    setStartTime('');
    setEndTime('');
    setGenre('');
    setStageOpen(false);
    setDayOpen(false);
    setGenreOpen(false);
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Artist</Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            scrollEnabled
            showsVerticalScrollIndicator
          >
            {/* Name (Required) */}
            <View style={styles.section}>
              <Text style={styles.label}>Artist Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter artist name"
                placeholderTextColor={colors.text.dim}
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            {/* Genre */}
            <View style={styles.section}>
              <Text style={styles.label}>Genre</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setGenreOpen(!genreOpen)}
                disabled={isLoading}
              >
                <Text style={[styles.dropdownText, !genre && styles.dropdownPlaceholder]}>
                  {genre || 'Select genre...'}
                </Text>
              </TouchableOpacity>
              {genreOpen && (
                <View style={styles.dropdownMenu}>
                  {GENRE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setGenre(opt);
                        setGenreOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, genre === opt && styles.dropdownItemActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Day */}
            <View style={styles.section}>
              <Text style={styles.label}>Day</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDayOpen(!dayOpen)}
                disabled={isLoading}
              >
                <Text style={[styles.dropdownText, !day && styles.dropdownPlaceholder]}>
                  {day || 'Select day...'}
                </Text>
              </TouchableOpacity>
              {dayOpen && (
                <View style={styles.dropdownMenu}>
                  {DAY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDay(opt);
                        setDayOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, day === opt && styles.dropdownItemActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Stage */}
            <View style={styles.section}>
              <Text style={styles.label}>Stage</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setStageOpen(!stageOpen)}
                disabled={isLoading}
              >
                <Text style={[styles.dropdownText, !stage && styles.dropdownPlaceholder]}>
                  {stage || 'Select stage...'}
                </Text>
              </TouchableOpacity>
              {stageOpen && (
                <View style={styles.dropdownMenu}>
                  {STAGE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setStage(opt);
                        setStageOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, stage === opt && styles.dropdownItemActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Start Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Start Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="14:30"
                placeholderTextColor={colors.text.dim}
                value={startTime}
                onChangeText={setStartTime}
                editable={!isLoading}
              />
            </View>

            {/* End Time */}
            <View style={styles.section}>
              <Text style={styles.label}>End Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="15:45"
                placeholderTextColor={colors.text.dim}
                value={endTime}
                onChangeText={setEndTime}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.hint}>Times and stage help detect conflicts and build schedules</Text>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.addButton, isLoading && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.base} />
              ) : (
                <>
                  <Plus size={18} color={colors.base} />
                  <Text style={styles.addButtonText}>Add Artist</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface.level1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  title: {
    ...typography.headline,
    color: colors.text.primary,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    ...typography.body,
  },
  dropdown: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  dropdownText: {
    ...typography.body,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.dim,
  },
  dropdownMenu: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.text.primary,
  },
  dropdownItemActive: {
    color: colors.accent.gold,
    fontWeight: '700',
  },
  hint: {
    ...typography.caption,
    color: colors.text.dim,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.surface.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.accent.gold,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.body,
    color: colors.base,
    fontWeight: '700',
  },
});
