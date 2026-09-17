/**
 * Meetup Map Component
 * Interactive map with draggable pin for group meetup location
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/tokens';
import { MeetupPin, MeetupPinType } from '@/lib/travelTypes';

interface MeetupMapProps {
  meetupPin: MeetupPin | null;
  onUpdatePin: (pin: MeetupPin | null) => void;
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
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [draftPin, setDraftPin] = useState<MeetupPin | null>(meetupPin);
  const [isDraftEditable, setIsDraftEditable] = useState(false);

  useEffect(() => {
    setDraftPin(meetupPin);
  }, [meetupPin]);

  const region = meetupPin
    ? {
        latitude: meetupPin.lat,
        longitude: meetupPin.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_CENTER;

  useEffect(() => {
    if (!isMapReady || !meetupPin || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: meetupPin.lat,
        longitude: meetupPin.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      250
    );
  }, [isMapReady, meetupPin]);

  function createDraftPin(coordinate: { latitude: number; longitude: number }): MeetupPin {
    return {
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      label: 'Group Meetup',
      notes: null,
      pin_type: 'meetup',
      created_by_id: null,
      created_by_name: null,
      updated_at: new Date().toISOString(),
    };
  }

  function openPinSheet(pin: MeetupPin, editable: boolean) {
    setDraftPin(pin);
    setIsDraftEditable(editable && isEditor);
    setIsSheetVisible(true);
  }

  function closePinSheet() {
    setIsSheetVisible(false);
    setIsEditMode(false);
  }

  function handleMapPress(e: any) {
    if (isEditor && isEditMode) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      openPinSheet(createDraftPin({ latitude, longitude }), true);
      setIsEditMode(false);
    }
  }

  function handleMarkerDragEnd(e: any) {
    if (isEditor) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const nextPin = {
        ...(meetupPin || createDraftPin({ latitude, longitude })),
        lat: latitude,
        lng: longitude,
        updated_at: new Date().toISOString(),
      };
      onUpdatePin(nextPin);
    }
  }

  function handleMarkerPress() {
    if (meetupPin) {
      openPinSheet(meetupPin, true);
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
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{meetupPin?.label || 'Group Meetup Location'}</Text>
            {!!meetupPin?.pin_type && (
              <Text style={styles.headerSubtitle}>{formatPinType(meetupPin.pin_type)}</Text>
            )}
          </View>
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
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          onMapReady={() => setIsMapReady(true)}
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
              onPress={handleMarkerPress}
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
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => openPinSheet(meetupPin, true)}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Edit Pin Details</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>
                Drag the pin to adjust the meetup location
              </Text>
            </>
          )}
        </View>
      )}

      <Modal
        visible={isSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={closePinSheet}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closePinSheet} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetKeyboard}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>
                    {isDraftEditable ? 'Pin Details' : 'Meetup Details'}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {draftPin?.label || 'Group Meetup'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closePinSheet} activeOpacity={0.7}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetBodyContent}>
                {draftPin && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Location</Text>
                    <Text style={styles.metaValue}>
                      {draftPin.lat.toFixed(5)}, {draftPin.lng.toFixed(5)}
                    </Text>
                  </View>
                )}

                {isDraftEditable ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Label</Text>
                      <TextInput
                        value={draftPin?.label || ''}
                        onChangeText={(value) =>
                          setDraftPin((prev) => (prev ? { ...prev, label: value } : prev))
                        }
                        placeholder="Main meetup, Carpool stop, Gate 3"
                        placeholderTextColor={colors.text.dim}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Pin Type</Text>
                      <View style={styles.typeRow}>
                        {PIN_TYPES.map((pinType) => {
                          const selected = draftPin?.pin_type === pinType;
                          return (
                            <TouchableOpacity
                              key={pinType}
                              style={[styles.typeChip, selected && styles.typeChipSelected]}
                              onPress={() =>
                                setDraftPin((prev) => (prev ? { ...prev, pin_type: pinType } : prev))
                              }
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                                {formatPinType(pinType)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Notes</Text>
                      <TextInput
                        value={draftPin?.notes || ''}
                        onChangeText={(value) =>
                          setDraftPin((prev) => (prev ? { ...prev, notes: value } : prev))
                        }
                        placeholder="Anything helpful for the group"
                        placeholderTextColor={colors.text.dim}
                        style={[styles.input, styles.notesInput]}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.readOnlyBlock}>
                    <Text style={styles.readOnlyText}>
                      {draftPin?.notes || 'No notes added yet.'}
                    </Text>
                  </View>
                )}

                {draftPin?.created_by_name ? (
                  <Text style={styles.footerMeta}>Added by {draftPin.created_by_name}</Text>
                ) : null}
              </ScrollView>

              <View style={styles.sheetActions}>
                {isDraftEditable && draftPin ? (
                  <>
                    <TouchableOpacity
                      style={[styles.sheetButton, styles.secondaryActionButton]}
                      onPress={closePinSheet}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.secondaryActionText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sheetButton, styles.primaryActionButton]}
                      onPress={() => {
                        if (!draftPin) return;
                        onUpdatePin({
                          ...draftPin,
                          label: draftPin.label.trim() || 'Group Meetup',
                          notes: draftPin.notes?.trim() || null,
                          updated_at: new Date().toISOString(),
                        });
                        closePinSheet();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.primaryActionText}>{meetupPin ? 'Save Changes' : 'Add Pin'}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.primaryActionButton]}
                    onPress={closePinSheet}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.primaryActionText}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {!isEditor && !meetupPin && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No meetup location set yet</Text>
        </View>
      )}
    </View>
  );
}

const PIN_TYPES: MeetupPinType[] = ['meetup', 'pickup', 'carpool', 'landmark'];

function formatPinType(pinType: MeetupPinType) {
  switch (pinType) {
    case 'pickup':
      return 'Pickup';
    case 'carpool':
      return 'Carpool';
    case 'landmark':
      return 'Landmark';
    default:
      return 'Meetup';
  }
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
    flex: 1,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
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
  secondaryButton: {
    backgroundColor: colors.surface.level2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetKeyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.base,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surface.level2,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sheetHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    fontSize: typography.size.appTitle,
    fontWeight: typography.weight.headline,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.mid,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: colors.text.mid,
  },
  sheetBody: {
    marginTop: spacing.lg,
  },
  sheetBodyContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  metaRow: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 4,
  },
  metaLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.dim,
    letterSpacing: typography.letterSpacing.wide,
  },
  metaValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.label,
    color: colors.text.mid,
    letterSpacing: typography.letterSpacing.wide,
  },
  input: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.size.body,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeChipSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.accent.gold,
  },
  typeChipText: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
    color: colors.text.primary,
  },
  typeChipTextSelected: {
    color: colors.base,
  },
  readOnlyBlock: {
    backgroundColor: colors.surface.level1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  readOnlyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.body,
    color: colors.text.primary,
  },
  footerMeta: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.body,
    color: colors.text.dim,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  secondaryActionButton: {
    backgroundColor: colors.surface.level1,
  },
  secondaryActionText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.text.primary,
  },
  primaryActionButton: {
    backgroundColor: colors.accent.gold,
  },
  primaryActionText: {
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
    color: colors.base,
  },
});
