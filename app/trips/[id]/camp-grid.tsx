import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
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
  const [festivalName, setFestivalName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orientationReady, setOrientationReady] = useState(false);
  const [gridMetrics, setGridMetrics] = useState<CampGridDropMetrics | null>(null);
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
    upsertGrid,
    addItem,
    updateItemPosition,
    rotateItem,
    deleteItem,
    saveLayoutToGroup,
  } = useCampGridDB(id);

  useLayoutEffect(() => {
    let isActive = true;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {
      // If orientation lock fails on web/simulator edge cases, keep screen usable.
    }).finally(() => {
      if (isActive) {
        setOrientationReady(true);
      }
    });

    return () => {
      isActive = false;
      ScreenOrientation.unlockAsync().catch(() => {
        // no-op
      });
    };
  }, []);

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

  const saveStatusText = isSavingLayout
    ? 'Saving layout...'
    : hasUnsavedChanges
      ? 'Unsaved group changes'
      : lastSavedAt
        ? 'Saved to group'
        : 'Local only';

  async function handleSidebarDrop(template: CampItemTemplate, point: { x: number; y: number }) {
    setDragPreview(null);

    if (!grid || !gridMetrics) {
      return;
    }

    const insideGrid =
      point.x >= gridMetrics.x &&
      point.x <= gridMetrics.x + gridMetrics.width &&
      point.y >= gridMetrics.y &&
      point.y <= gridMetrics.y + gridMetrics.height;

    if (!insideGrid) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color={colors.text.mid} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Camp Grid</Text>
          <Text style={styles.headerSubtitle}>{festivalName || 'Custom Festival'}</Text>
        </View>
        <View style={styles.saveWrap}>
          <TouchableOpacity
            style={[styles.saveButton, isSavingLayout && styles.saveButtonDisabled]}
            onPress={async () => {
              const didSave = await saveLayoutToGroup();
              if (didSave) {
                Alert.alert('Camp Grid Saved', 'The latest layout has been saved for your group.');
              }
            }}
            disabled={isSavingLayout}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonLabel}>{isSavingLayout ? 'Saving...' : 'Save Layout'}</Text>
          </TouchableOpacity>
          <Text style={styles.saveStatus}>{saveStatusText}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.gridPane}>
          <CampGridScene
            grid={grid}
            items={items}
            onUpdateGrid={upsertGrid}
            onMoveItem={updateItemPosition}
            onRotateItem={rotateItem}
            onDeleteItem={deleteItem}
            onGridMetricsChange={setGridMetrics}
          />
        </View>

        <ItemLibrarySidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
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
      </View>

      {dragPreview && (
        <View pointerEvents="none" style={styles.dragPreviewLayer}>
          <View
            style={[
              styles.dragPreviewCard,
              {
                left: dragPreview.x - ((dragPreview.template.widthFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14)) / 2,
                top: dragPreview.y - ((dragPreview.template.heightFt / grid.cellSizeFt) * (gridMetrics?.cellPx ?? 14)) / 2,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCopy: {
    gap: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
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
    alignItems: 'flex-end',
    gap: 4,
  },
  saveButton: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent.gold,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonLabel: {
    color: colors.base,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  saveStatus: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  gridPane: {
    flex: 1,
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
