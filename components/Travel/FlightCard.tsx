/**
 * Flight Card Component
 * Displays flight details and pickup status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Plane, MapPin, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { FlightDetail } from '@/lib/travelTypes';

interface FlightCardProps {
  flight: FlightDetail;
  currentUserId?: string;
  isEditor: boolean;
  onEdit: (flight: FlightDetail) => void;
  onDelete: (flightId: string) => void;
}

export function FlightCard({
  flight,
  currentUserId,
  isEditor,
  onEdit,
  onDelete,
}: FlightCardProps) {
  const isOwnFlight = currentUserId === flight.user_id;
  const flightLabel = [flight.airline, flight.flight_number].filter(Boolean).join(' ');

  function handleDeletePress() {
    Alert.alert(
      'Delete Flight',
      'Remove these flight details?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(flight.id),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Plane size={20} color={colors.accent.gold} strokeWidth={2} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{flight.user?.display_name || 'User'}</Text>
            {!!flightLabel && <Text style={styles.flightNumber}>{flightLabel}</Text>}
          </View>
        </View>

        {(isEditor || isOwnFlight) && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(flight)}
              activeOpacity={0.7}
            >
              <Edit size={18} color={colors.text.mid} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {flight.arrival_airport && (
          <View style={styles.detailRow}>
            <MapPin size={14} color={colors.text.dim} strokeWidth={2} />
            <Text style={styles.detailText}>{flight.arrival_airport}</Text>
          </View>
        )}
        {flight.arrival_time && (
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.text.dim} strokeWidth={2} />
            <Text style={styles.detailText}>
              {new Date(flight.arrival_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Pickup Status */}
      {flight.needs_pickup && (
        <View
          style={[
            styles.pickupStatus,
            flight.pickup_vehicle_id
              ? styles.pickupAssigned
              : styles.pickupNeeded,
          ]}
        >
          <AlertCircle
            size={14}
            color={flight.pickup_vehicle_id ? colors.success : colors.warning}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.pickupText,
              flight.pickup_vehicle_id
                ? styles.pickupAssignedText
                : styles.pickupNeededText,
            ]}
          >
            {flight.pickup_vehicle_id
              ? `Pickup arranged${flight.pickup_vehicle?.make_model ? `: ${flight.pickup_vehicle.make_model}` : ''}`
              : 'Needs pickup from airport'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  flightNumber: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  pickupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pickupNeeded: {
    backgroundColor: 'rgba(229, 201, 110, 0.1)',
  },
  pickupAssigned: {
    backgroundColor: 'rgba(40, 200, 150, 0.1)',
  },
  pickupText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
  },
  pickupNeededText: {
    color: colors.warning,
  },
  pickupAssignedText: {
    color: colors.success,
  },
});
