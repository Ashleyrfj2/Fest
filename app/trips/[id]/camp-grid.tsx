import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { CampGridDropMetrics, CampGridScene } from '@/components/CampGrid/CampGridScene';
import { CustomItemModal } from '@/components/CampGrid/CustomItemModal';
import { DimensionModal } from '@/components/CampGrid/DimensionModal';
import { ItemLibrarySidebar } from '@/components/CampGrid/ItemLibrarySidebar';
import { CampItemTemplate, clamp, snapFeetToCell } from '@/lib/campGridTypes';
import { useCampGridDB } from '@/lib/sqlite/useCampGridDB';
import { supabase } from '@/lib/supabase';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';

export default function CampGridScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: viewportWidth } = useWindowDimensions();
  const [festivalName, setFestivalName] = useState('');
  const [orientationReady, setOrientationReady] = useState(false);
  const [gridMetrics, setGridMetrics] = useState<CampGridDropMetrics | null>(null);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [dragPreview, setDragPreview] = useState<{
    template: CampItemTemplate;
    x: number;
    y: number;
  } | null>(null);

  const {
    grid,
    items,
    isLoading,
    error,
    hasConfiguredGrid,
    hasUnsavedChanges,
    isSavingLayout,
    lastSavedAt,
    remoteLoadStatus,
    pendingDestructiveDeleteCount,
    retryRemoteLoad,
    upsertGrid,
    addItem,
    updateItemPosition,
    rotateItem,
    deleteItem,
    saveLayoutToGroup,
  } = useCampGridDB(id);

  const itemLibraryWidth = Math.round(clamp(viewportWidth * 0.19, 166, 194));
  const isCompactHeader = viewportWidth < 880;
  const saveButtonMinWidth = isCompactHeader ? 104 : 126;
  const remoteSyncBlocked = remoteLoadStatus === 'failed';

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let previousOrientationLock: ScreenOrientation.OrientationLock | null = null;

      setOrientationReady(false);

      const lockToCampGridLandscape = async () => {
        try {
          previousOrientationLock = await ScreenOrientation.getOrientationLockAsync();
        } catch {
          previousOrientationLock = null;
        }

        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch {
          // If orientation lock fails on web/simulator edge cases, keep screen usable.
        } finally {
          if (isActive) {
            setOrientationReady(true);
          }
        }
      };

      void lockToCampGridLandscape();

      return () => {
        isActive = false;

        const restorePreviousOrientationLock = async () => {
          if (previousOrientationLock !== null) {
            await ScreenOrientation.lockAsync(previousOrientationLock);
            return;
          }

          await ScreenOrientation.unlockAsync();
        };

        void restorePreviousOrientationLock().catch(() => {
          // no-op
        });
      };
    }, [])
  );

  useEffect(() => {
    async function loadFestivalName() {
      if (!id) return;
      const { data, error: tripError } = await supabase
        .from('trips')
        .select('festival_name')
        .eq('id', id)
        .single();

      if (tripError) {
        console.error('Failed loading trip festival name:', tripError);
        return;
      }

      setFestivalName(data.festival_name ?? '');
    }

    loadFestivalName();
  }, [id]);

  useEffect(() => {
    if (error) {
      Alert.alert('Camp Grid Error', error);
    }
  }, [error]);

  useEffect(() => {
    if (!dropFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setDropFeedback(null);
    }, 2200);

    return () => clearTimeout(timer);
  }, [dropFeedback]);

  const saveStatusText = isSavingLayout
    ? 'Saving layout...'
    : remoteSyncBlocked
      ? 'Shared sync needed before destructive save'
    : hasUnsavedChanges
      ? 'Unsaved group changes'
      : lastSavedAt
        ? 'Saved to group'
        : 'Local only';

  const saveStatusTone = isSavingLayout
    ? styles.saveStatusSaving
    : remoteSyncBlocked
      ? styles.saveStatusBlocked
    : hasUnsavedChanges
      ? styles.saveStatusUnsaved
      : lastSavedAt
        ? styles.saveStatusSaved
        : styles.saveStatusLocal;

  const saveStatusDisplayText = isSavingLayout
    ? 'Saving'
    : remoteSyncBlocked
      ? 'Retry Sync'
    : hasUnsavedChanges
      ? 'Unsaved'
      : lastSavedAt
        ? 'Saved'
        : 'Local';

  const saveButtonText = isSavingLayout
    ? (isCompactHeader ? 'Saving' : 'Saving...')
    : (isCompactHeader ? 'Save' : 'Save Layout');

  async function handleSaveLayout(allowDestructiveOverwrite = false) {
    const result = await saveLayoutToGroup({ allowDestructiveOverwrite });

    if (result.ok) {
      Alert.alert('Camp Grid Saved', 'The latest layout has been saved for your group.');
      return;
    }

    if (result.blockedReason === 'not-authorized') {
      Alert.alert('Save unavailable', 'You do not have permission to save this shared layout right now.');
      return;
    }

    if (result.blockedReason === 'remote-load-failed') {
      Alert.alert(
        'Sync needed',
        'We could not verify the shared layout. Retry sync before saving.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Retry Sync',
            onPress: () => {
              void retryRemoteLoad();
            },
          },
        ]
      );
      return;
    }

    if (result.blockedReason === 'destructive-overwrite-risk') {
      const deleteCount = result.deleteCount || pendingDestructiveDeleteCount;
      const itemLabel = deleteCount === 1 ? 'item' : 'items';
      Alert.alert(
        'Confirm overwrite',
        `Saving now may remove ${deleteCount} shared ${itemLabel}. Retry sync first, or confirm overwrite to continue.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Retry Sync',
            onPress: () => {
              void retryRemoteLoad();
            },
          },
          {
            text: 'Overwrite',
            style: 'destructive',
            onPress: () => {
              void handleSaveLayout(true);
            },
          },
        ]
      );
      return;
    }
  }

  async function handleSidebarDrop(template: CampItemTemplate, point: { x: number; y: number }) {
    setDragPreview(null);

    if (!grid || !gridMetrics) {
      setDropFeedback('Tap an item in the library to place it on the grid.');
      return;
    }

    const insideGrid =
      point.x >= gridMetrics.x &&
      point.x <= gridMetrics.x + gridMetrics.width &&
      point.y >= gridMetrics.y &&
      point.y <= gridMetrics.y + gridMetrics.height;

    if (!insideGrid) {
      setDropFeedback('Item was not added. Tap the item to add it to the grid.');
      return;
    }

    const itemWidthPx = (template.widthFt / grid.cellSizeFt) * gridMetrics.cellPx;
    const itemHeightPx = (template.heightFt / grid.cellSizeFt) * gridMetrics.cellPx;
    const rawLeftPx = point.x - gridMetrics.x - itemWidthPx / 2;
    const rawTopPx = point.y - gridMetrics.y - itemHeightPx / 2;
    const snappedXFt = snapFeetToCell(
      Math.round(rawLeftPx / gridMetrics.cellPx) * grid.cellSizeFt,
      grid.cellSizeFt
    );
    const snappedYFt = snapFeetToCell(
      Math.round(rawTopPx / gridMetrics.cellPx) * grid.cellSizeFt,
      grid.cellSizeFt
    );

    await addItem(template, {
      xFt: clamp(snappedXFt, 0, Math.max(0, grid.widthFt - template.widthFt)),
      yFt: clamp(snappedYFt, 0, Math.max(0, grid.heightFt - template.heightFt)),
    });
  }

  if (!orientationReady || isLoading || !grid) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.accent.gold} />
        <Text style={styles.loadingText}>{orientationReady ? 'Loading camp grid...' : 'Preparing camp grid...'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <LinearGradient
        colors={[colors.base, colors.surface.level1, colors.base]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pageGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (id) {
                router.replace({ pathname: '/trips/[id]', params: { id } });
                return;
              }
              router.back();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={colors.text.mid} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} numberOfLines={1}>Camp Grid</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{festivalName || 'Custom Festival'}</Text>
          </View>
          <View style={styles.saveWrap}>
            <Text style={[styles.saveStatus, saveStatusTone]} numberOfLines={1}>{saveStatusDisplayText}</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { minWidth: saveButtonMinWidth },
                isSavingLayout && styles.saveButtonDisabled,
              ]}
              onPress={() => {
                void handleSaveLayout();
              }}
              disabled={isSavingLayout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Save layout"
            >
              <LinearGradient
                colors={[colors.accent.goldBright, colors.accent.gold, colors.festival.electricForest.mid]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonLabel}>{saveButtonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.gridPane}>
            {dropFeedback && (
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.97)', 'rgba(196, 32, 112, 0.97)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dropFeedbackBanner}
              >
                <Text style={styles.dropFeedbackText}>{dropFeedback}</Text>
              </LinearGradient>
            )}

            <CampGridScene
              grid={grid}
              items={items}
              onUpdateGrid={upsertGrid}
              onMoveItem={updateItemPosition}
              onRotateItem={rotateItem}
              onDeleteItem={deleteItem}
              itemLibraryWidth={itemLibraryWidth}
              itemLibraryPanel={
                <ItemLibrarySidebar
                  onAddItem={addItem}
                  onDragStart={(template, point) => {
                    setDragPreview({
                      template,
                      x: point.x,
                      y: point.y,
                    });
                  }}
                  onDragMove={(point) => {
                    setDragPreview((current) => (current ? { ...current, x: point.x, y: point.y } : current));
                  }}
                  onDragEnd={handleSidebarDrop}
                  onDragCancel={() => setDragPreview(null)}
                  onCreateCustomItem={() => setShowCustomItemModal(true)}
                />
              }
              onGridMetricsChange={setGridMetrics}
            />
          </View>

          {dragPreview && (
            <View pointerEvents="none" style={styles.dragPreviewLayer}>
              <View
                style={[
                  styles.dragPreviewCard,
                  {
                    left:
                      dragPreview.x -
                      ((dragPreview.template.widthFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14)) / 2,
                    top:
                      dragPreview.y -
                      ((dragPreview.template.heightFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14)) / 2,
                    width: (dragPreview.template.widthFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14),
                    height: (dragPreview.template.heightFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14),
                    backgroundColor: dragPreview.template.color,
                  },
                ]}
              >
                <Text style={styles.dragPreviewText} numberOfLines={1}>
                  {dragPreview.template.label}
                </Text>
              </View>
            </View>
          )}

          <DimensionModal
            visible={!hasConfiguredGrid}
            festivalName={festivalName}
            onSave={({ widthFt, heightFt, cellSizeFt, measurementUnit, festivalPreset }) => {
              upsertGrid({
                widthFt,
                heightFt,
                cellSizeFt,
                measurementUnit,
                festivalPreset,
              });
            }}
          />

          <CustomItemModal
            visible={showCustomItemModal}
            onClose={() => setShowCustomItemModal(false)}
            onSave={async (template) => {
              await addItem(template);
            }}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  pageGradient: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.mid,
    fontSize: typography.size.body,
  },
  header: {
    marginHorizontal: spacing.xs,
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
    zIndex: 30,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.22)',
    backgroundColor: 'rgba(28, 24, 41, 0.86)',
  },
  headerCopy: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    borderWidth: 1,
    borderColor: 'rgba(180, 122, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
  },
  headerSubtitle: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
  },
  saveWrap: {
    marginLeft: 'auto',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
    minWidth: 0,
  },
  saveButton: {
    borderRadius: borderRadius.full,
    minHeight: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonGradient: {
    minHeight: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonLabel: {
    color: colors.base,
    fontSize: 12,
    fontWeight: typography.weight.label,
  },
  saveStatus: {
    fontSize: 11,
    fontWeight: typography.weight.label,
    maxWidth: 60,
    textAlign: 'right',
  },
  saveStatusSaving: {
    color: colors.warning,
  },
  saveStatusUnsaved: {
    color: colors.danger,
  },
  saveStatusBlocked: {
    color: colors.warning,
  },
  saveStatusSaved: {
    color: colors.success,
  },
  saveStatusLocal: {
    color: colors.text.mid,
  },
  content: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },
  gridPane: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },
  dropFeedbackBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 35,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropFeedbackText: {
    color: colors.base,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  dragPreviewLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  dragPreviewCard: {
    position: 'absolute',
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    opacity: 0.9,
  },
  dragPreviewText: {
    color: colors.base,
    fontSize: typography.size.meta,
    fontWeight: typography.weight.label,
  },
});