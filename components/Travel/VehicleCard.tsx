/**
 * Vehicle Card Component
 * Displays vehicle details with driver and passenger list
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Car, User, MapPin, Clock, MoreVertical, Trash2, Edit } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { Vehicle, VehiclePassenger } from '@/lib/travelTypes';
import { formatDistanceToNow } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  currentUserId?: string;
  isEditor: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onAddPassenger: (vehicleId: string) => void;
  onRemovePassenger: (vehicleId: string, userId: string) => void;
}

export function VehicleCard({
  vehicle,
  currentUserId,
  isEditor,
  onEdit,
  onDelete,
  onAddPassenger,
  onRemovePassenger,
}: VehicleCardProps) {
  const passengers = vehicle.passengers || [];
  const availableSeats = vehicle.capacity - passengers.length - 1; // -1 for driver
  const isDriver = currentUserId === vehicle.driver_id;
  const isPassenger = passengers.some((p) => p.user_id === currentUserId);

  function handleDeletePress() {
    Alert.alert(
      'Delete Vehicle',
      `Remove ${vehicle.make_model || 'this vehicle'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(vehicle.id),
        },
      ]
    );
  }

  function handleRemovePassenger(userId: string) {
    Alert.alert(
      'Remove Passenger',
      'Remove this passenger from the vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemovePassenger(vehicle.id, userId),
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
            <Car size={20} color={colors.accent.gold} strokeWidth={2} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.makeModel}>{vehicle.make_model || 'Ride Available'}</Text>
            <Text style={styles.capacity}>
              {availableSeats > 0
                ? `${availableSeats} seat${availableSeats === 1 ? '' : 's'} available`
                : 'Full'}
            </Text>
          </View>
        </View>

        {isEditor && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(vehicle)}
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
      {(vehicle.departure_city || vehicle.departure_time) && (
        <View style={styles.details}>
          {vehicle.departure_city && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.text.dim} strokeWidth={2} />
              <Text style={styles.detailText}>From {vehicle.departure_city}</Text>
            </View>
          )}
          {vehicle.departure_time && (
            <View style={styles.detailRow}>
              <Clock size={14} color={colors.text.dim} strokeWidth={2} />
              <Text style={styles.detailText}>
                {new Date(vehicle.departure_time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {!!(vehicle.waypoints && vehicle.waypoints.length > 0) && (
        <View style={styles.waypointsSection}>
          <Text style={styles.sectionLabel}>PICKUP STOPS</Text>
          {(vehicle.waypoints || [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((waypoint, index) => (
              <Text key={`${vehicle.id}-waypoint-${index}`} style={styles.waypointText}>
                {index + 1}. {waypoint.address}
              </Text>
            ))}
        </View>
      )}

      {/* Driver */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DRIVER</Text>
        <View style={styles.personRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: vehicle.driver?.avatar_color || colors.surface.level2 },
            ]}
          >
            <Text style={styles.avatarText}>
              {(vehicle.driver?.display_name || 'D')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.personName}>{vehicle.driver?.display_name || 'Driver'}</Text>
          {isDriver && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
        </View>
      </View>

      {/* Passengers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            PASSENGERS ({passengers.length}/{vehicle.capacity - 1})
          </Text>
          {isEditor && availableSeats > 0 && !isPassenger && !isDriver && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => onAddPassenger(vehicle.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>Join Ride</Text>
            </TouchableOpacity>
          )}
        </View>

        {passengers.length > 0 ? (
          passengers.map((passenger) => (
            <View key={passenger.user_id} style={styles.personRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: passenger.user?.avatar_color || colors.surface.level2 },
                ]}
              >
                <Text style={styles.avatarText}>
                  {(passenger.user?.display_name || 'P')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.personName}>{passenger.user?.display_name || 'Passenger'}</Text>
              {passenger.user_id === currentUserId && (
                <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
              )}
              {isEditor && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePassenger(passenger.user_id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No passengers yet</Text>
        )}
      </View>
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
  makeModel: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  capacity: {
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
  waypointsSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  waypointText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
    paddingLeft: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    letterSpacing: typography.letterSpacing.wide,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  personName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
    flex: 1,
  },
  youBadge: {
    backgroundColor: colors.accent.goldDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.base,
  },
  joinButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  joinButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  removeButtonText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.danger,
  },
  emptyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
