/**
 * Web-safe meetup surface.
 *
 * react-native-maps is native-only in this Expo setup. Keep the full map in
 * MeetupMap.tsx for iOS/Android and provide a useful coordinate-based fallback
 * on web so the Travel route can still render and edit the shared pin.
 */

import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPin, Trash2 } from 'lucide-react-native';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { MeetupPin } from '@/lib/travelTypes';

interface MeetupMapProps {
  meetupPin: MeetupPin | null;
  onUpdatePin: (pin: MeetupPin | null) => void;
  isEditor: boolean;
}

const DEFAULT_PIN: MeetupPin = {
  lat: 39.8283,
  lng: -98.5795,
  label: 'Group Meetup',
  notes: null,
  pin_type: 'meetup',
  created_by_id: null,
  created_by_name: null,
  updated_at: new Date(0).toISOString(),
};

export function MeetupMap({ meetupPin, onUpdatePin, isEditor }: MeetupMapProps) {
  function handleRemovePin() {
    Alert.alert('Remove Meetup Pin', 'Remove the group meetup location?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onUpdatePin(null) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <MapPin size={20} color={colors.accent.gold} strokeWidth={2} />
            <Text style={styles.title}>{meetupPin?.label || 'Group Meetup Location'}</Text>
          </View>
          <Text style={styles.subtitle}>Web coordinate preview</Text>
        </View>
        {isEditor && meetupPin && (
          <TouchableOpacity onPress={handleRemovePin} style={styles.removeButton}>
            <Trash2 size={16} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.preview}>
        <MapPin size={34} color={colors.accent.gold} strokeWidth={1.8} />
        {meetupPin ? (
          <>
            <Text style={styles.locationLabel}>{meetupPin.label || 'Group Meetup'}</Text>
            <Text style={styles.coordinates}>
              {meetupPin.lat.toFixed(5)}, {meetupPin.lng.toFixed(5)}
            </Text>
            <Text style={styles.helper}>
              Interactive map controls are available in the native app.
            </Text>
          </>
        ) : (
          <Text style={styles.helper}>No meetup location has been set.</Text>
        )}
      </View>

      {isEditor && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onUpdatePin(meetupPin ?? DEFAULT_PIN)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {meetupPin ? 'Keep Meetup Pin' : 'Set Default Meetup Pin'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.level2,
    overflow: 'hidden',
  },
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text.primary, ...typography.body, fontWeight: '700' },
  subtitle: { color: colors.text.secondary, ...typography.caption, marginTop: 3 },
  removeButton: { padding: spacing.sm },
  preview: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.subtle,
  },
  locationLabel: { color: colors.text.primary, ...typography.body, fontWeight: '700', marginTop: spacing.sm },
  coordinates: { color: colors.accent.gold, ...typography.body, marginTop: 4 },
  helper: { color: colors.text.secondary, ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
  primaryButton: {
    alignSelf: 'flex-start',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.gold,
  },
  primaryButtonText: { color: colors.base, ...typography.caption, fontWeight: '700' },
});
