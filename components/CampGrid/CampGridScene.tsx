import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RotateCw, Settings, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clamp, CampGridConfig, CampItem, snapFeetToCell } from '@/lib/campGridTypes';
import { borderRadius, colors, spacing, typography } from '@/lib/tokens';
import { GridBackground } from '@/components/CampGrid/GridBackground';
import { GridSettingsPanel } from '@/components/CampGrid/GridSettingsPanel';
import { ItemCard } from '@/components/CampGrid/ItemCard';

export interface CampGridDropMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  cellPx: number;
}

interface CampGridSceneProps {
  grid: CampGridConfig;
  items: CampItem[];
  onUpdateGrid: (partial: Partial<Omit<CampGridConfig, 'tripId'>>) => Promise<void>;
  onMoveItem: (itemId: string, xFt: number, yFt: number) => Promise<void>;
  onRotateItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  itemLibraryPanel?: React.ReactNode;
  itemLibraryWidth?: number;
  onGridMetricsChange?: (metrics: CampGridDropMetrics | null) => void;
}

export function CampGridScene({
  grid,
  items,
  onUpdateGrid,
  onMoveItem,
  onRotateItem,
  onDeleteItem,
  itemLibraryPanel,
  itemLibraryWidth,
  onGridMetricsChange,
}: CampGridSceneProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const gridLayerRef = useRef<View | null>(null);

  const cols = Math.max(1, Math.round(grid.widthFt / grid.cellSizeFt));
  const rows = Math.max(1, Math.round(grid.heightFt / grid.cellSizeFt));

  const cellPx = useMemo(() => {
    if (!canvasSize.width || !canvasSize.height) return 16;
    return Math.max(10, Math.min(canvasSize.width / cols, canvasSize.height / rows));
  }, [canvasSize.height, canvasSize.width, cols, rows]);

  const gridWidthPx = cols * cellPx;
  const gridHeightPx = rows * cellPx;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({
      width: Math.max(0, width - 2),
      height: Math.max(0, height - 2),
    });
  }, []);

  const reportGridMetrics = useCallback(() => {
    if (!onGridMetricsChange || !gridLayerRef.current || !gridWidthPx || !gridHeightPx) return;

    gridLayerRef.current.measureInWindow((x, y, width, height) => {
      onGridMetricsChange({
        x,
        y,
        width,
        height,
        cellPx,
      });
    });
  }, [cellPx, gridHeightPx, gridWidthPx, onGridMetricsChange]);

  useEffect(() => {
    if (!onGridMetricsChange) return;

    const frame = requestAnimationFrame(reportGridMetrics);
    return () => cancelAnimationFrame(frame);
  }, [onGridMetricsChange, reportGridMetrics]);

  const handleDrop = useCallback(
    async (itemId: string, leftPx: number, topPx: number) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return;

      const xCells = Math.round(leftPx / cellPx);
      const yCells = Math.round(topPx / cellPx);
      const snappedXFt = snapFeetToCell(xCells * grid.cellSizeFt, grid.cellSizeFt);
      const snappedYFt = snapFeetToCell(yCells * grid.cellSizeFt, grid.cellSizeFt);

      const maxX = Math.max(0, grid.widthFt - item.widthFt);
      const maxY = Math.max(0, grid.heightFt - item.heightFt);

      await onMoveItem(itemId, clamp(snappedXFt, 0, maxX), clamp(snappedYFt, 0, maxY));
    },
    [cellPx, grid.cellSizeFt, grid.heightFt, grid.widthFt, items, onMoveItem]
  );

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrap} onLayout={handleLayout}>
        <View pointerEvents="none" style={styles.canvasGlowTop} />
        <View pointerEvents="none" style={styles.canvasGlowBottom} />

        <View pointerEvents="box-none" style={styles.hudWrap}>
          <LinearGradient
            colors={['rgba(10, 77, 58, 0.84)', 'rgba(28, 24, 41, 0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoChip}
          >
            <Text style={styles.metaText}>
              {grid.widthFt} x {grid.heightFt} ft
            </Text>
            <Text style={styles.subMetaText}>
              Cell {grid.cellSizeFt}ft • Unit {grid.measurementUnit}
            </Text>
          </LinearGradient>

          <View style={[styles.rightRail, { width: itemLibraryWidth ?? 178 }]}>
            <View style={styles.topBarActions}>
              {selectedItem && (
                <TouchableOpacity
                  style={[styles.iconButton, styles.rotateButton]}
                  onPress={() => onRotateItem(selectedItem.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Rotate selected item"
                >
                  <RotateCw size={18} color={colors.text.primary} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
              {selectedItem && (
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => {
                    Alert.alert(
                      'Delete item?',
                      `Remove ${selectedItem.label} from this layout?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            void onDeleteItem(selectedItem.id);
                            setSelectedItemId(null);
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Delete selected item"
                >
                  <Trash2 size={18} color={colors.danger} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.iconButton, styles.settingsButton]}
                onPress={() => setShowSettings((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={showSettings ? 'Hide grid settings' : 'Show grid settings'}
              >
                <Settings size={18} color={colors.text.primary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {itemLibraryPanel ? <View style={styles.itemLibraryWrap}>{itemLibraryPanel}</View> : null}
          </View>

          {showSettings && (
            <View style={styles.settingsOverlay}>
              <GridSettingsPanel
                cellSizeFt={grid.cellSizeFt}
                measurementUnit={grid.measurementUnit}
                onCellSizeChange={(cellSizeFt) => onUpdateGrid({ cellSizeFt })}
                onMeasurementUnitChange={(measurementUnit) => onUpdateGrid({ measurementUnit })}
              />
            </View>
          )}
        </View>

        <View
          ref={gridLayerRef}
          onLayout={reportGridMetrics}
          style={[styles.gridLayer, { width: gridWidthPx, height: gridHeightPx }]}
        >
          <GridBackground
            widthPx={gridWidthPx}
            heightPx={gridHeightPx}
            cols={cols}
            rows={rows}
            cellPx={cellPx}
          />

          {items.map((item) => {
            const left = (item.xFt / grid.cellSizeFt) * cellPx;
            const top = (item.yFt / grid.cellSizeFt) * cellPx;
            const width = (item.widthFt / grid.cellSizeFt) * cellPx;
            const height = (item.heightFt / grid.cellSizeFt) * cellPx;

            return (
              <ItemCard
                key={item.id}
                item={item}
                left={left}
                top={top}
                width={width}
                height={height}
                selected={selectedItemId === item.id}
                onSelect={setSelectedItemId}
                onDrop={handleDrop}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
  },
  hudWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  infoChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(40, 200, 150, 0.3)',
    maxWidth: '35%',
    overflow: 'hidden',
  },
  metaText: {
    color: colors.text.primary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.label,
  },
  subMetaText: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
    marginTop: 1,
  },
  rightRail: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    alignItems: 'center',
    zIndex: 23,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  itemLibraryWrap: {
    marginTop: spacing.xs,
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  settingsOverlay: {
    position: 'absolute',
    top: 68,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 22,
    maxWidth: 420,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(21, 18, 32, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 4,
  },
  rotateButton: {
    backgroundColor: 'rgba(18, 120, 90, 0.26)',
    borderColor: 'rgba(40, 200, 150, 0.46)',
  },
  deleteButton: {
    backgroundColor: 'rgba(122, 16, 72, 0.32)',
    borderColor: 'rgba(255, 107, 107, 0.46)',
  },
  settingsButton: {
    backgroundColor: 'rgba(201, 168, 76, 0.22)',
    borderColor: 'rgba(201, 168, 76, 0.5)',
  },
  canvasWrap: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(180, 122, 255, 0.26)',
    overflow: 'hidden',
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    position: 'relative',
  },
  canvasGlowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    top: -90,
    right: -70,
    backgroundColor: 'rgba(180, 122, 255, 0.1)',
  },
  canvasGlowBottom: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 230,
    bottom: -110,
    left: -60,
    backgroundColor: 'rgba(40, 200, 150, 0.08)',
  },
  gridLayer: {
    position: 'relative',
  },
});