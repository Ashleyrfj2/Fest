/**
 * Meetup Map Component
 * Interactive map with draggable pin for group meetup location
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { LatLng } from '@/lib/travelTypes';

interface MeetupMapProps {
  meetupPin: LatLng | null;
  onUpdatePin: (pin: LatLng | null) => void;
  isEditor: boolean;
}

// Default center (USA center, or could be festival location)
const DEFAULT_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

export function MeetupMap({ meetupPin, onUpdatePin, isEditor }: MeetupMapProps) {
  const mapRef = useRef<MapView>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const region = meetupPin
    ? {
        latitude: meetupPin.lat,
        longitude: meetupPin.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_CENTER;

  function handleMapPress(e: any) {
    if (isEditor && isEditMode) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onUpdatePin({ lat: latitude, lng: longitude });
    }
  }

  function handleMarkerDragEnd(e: any) {
    if (isEditor) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onUpdatePin({ lat: latitude, lng: longitude });
    }
  }

  function handleRemovePin() {
    Alert.alert(
      'Remove Meetup Pin',
      'Remove the group meetup location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onUpdatePin(null);
            setIsEditMode(false);
          },
        },
      ]
    );
  }

  function handleCenterMap() {
    if (meetupPin && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: meetupPin.lat,
        longitude: meetupPin.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPin size={20} color={colors.accent.gold} strokeWidth={2} />
          <Text style={styles.headerTitle}>Group Meetup Location</Text>
        </View>
        {isEditor && meetupPin && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemovePin}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {meetupPin && (
            <Marker
              coordinate={{
                latitude: meetupPin.lat,
                longitude: meetupPin.lng,
              }}
              draggable={isEditor}
              onDragEnd={handleMarkerDragEnd}
              pinColor={colors.accent.gold}
            />
          )}
        </MapView>

        {/* Map Controls */}
        {meetupPin && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={handleCenterMap}
            activeOpacity={0.7}
          >
            <Navigation size={20} color={colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      {isEditor && (
        <View style={styles.instructions}>
          {!meetupPin ? (
            <>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsEditMode(!isEditMode)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>
                  {isEditMode ? 'Tap map to add pin' : 'Add Meetup Pin'}
                </Text>
              </TouchableOpacity>
              {isEditMode && (
                <Text style={styles.hint}>
                  Tap anywhere on the map to set the group meetup location
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.hint}>
              Drag the pin to adjust the meetup location
            </Text>
          )}
        </View>
      )}

      {!isEditor && !meetupPin && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No meetup location set yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.level2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 250,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  instructions: {
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
  hint: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    textAlign: 'center',
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
    fontStyle: 'italic',
  },
});
