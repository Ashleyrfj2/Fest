import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RotateCw, Settings, Trash2 } from 'lucide-react-native';
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
  onGridMetricsChange?: (metrics: CampGridDropMetrics | null) => void;
}

export function CampGridScene({
  grid,
  items,
  onUpdateGrid,
  onMoveItem,
  onRotateItem,
  onDeleteItem,
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
    setCanvasSize({ width: width - 8, height: height - 8 });
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
      <View style={styles.topBar}>
        <View>
          <Text style={styles.metaText}>
            {grid.widthFt} x {grid.heightFt} ft
          </Text>
          <Text style={styles.subMetaText}>
            Cell {grid.cellSizeFt}ft • Unit {grid.measurementUnit}
          </Text>
        </View>

        <View style={styles.topBarActions}>
          {selectedItem && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onRotateItem(selectedItem.id)}
              activeOpacity={0.8}
            >
              <RotateCw size={18} color={colors.text.primary} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
          {selectedItem && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onDeleteItem(selectedItem.id)}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSettings((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Settings size={18} color={colors.text.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {showSettings && (
        <View style={styles.settingsWrap}>
          <GridSettingsPanel
            cellSizeFt={grid.cellSizeFt}
            measurementUnit={grid.measurementUnit}
            onCellSizeChange={(cellSizeFt) => onUpdateGrid({ cellSizeFt })}
            onMeasurementUnitChange={(measurementUnit) => onUpdateGrid({ measurementUnit })}
          />
        </View>
      )}

      <View style={styles.canvasWrap} onLayout={handleLayout}>
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
    padding: spacing.md,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    color: colors.text.primary,
    fontSize: typography.size.cardTitle,
    fontWeight: typography.weight.cardTitle,
  },
  subMetaText: {
    color: colors.text.dim,
    fontSize: typography.size.meta,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  settingsWrap: {
    maxWidth: 420,
  },
  canvasWrap: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
    backgroundColor: colors.surface.level1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLayer: {
    position: 'relative',
  },
});
