import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import {
  CampGridConfig,
  CampItem,
  CampItemTemplate,
  CellSizeValue,
  MeasurementUnit,
  clamp,
  snapFeetToCell,
} from '@/lib/campGridTypes';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCampGridDb, initCampGridDb } from '@/lib/sqlite/db';
import { supabase } from '@/lib/supabase';

const DEFAULT_GRID: Omit<CampGridConfig, 'tripId'> = {
  widthFt: 20,
  heightFt: 20,
  cellSizeFt: 1,
  measurementUnit: 'ft',
  festivalPreset: null,
};

interface LocalGridRow {
  trip_id: string;
  width_ft: number;
  height_ft: number;
  cell_size_ft: number;
  measurement_unit: MeasurementUnit;
  festival_preset: string | null;
  updated_at: string;
}

interface LocalItemRow {
  id: string;
  trip_id: string;
  item_type: CampItem['itemType'];
  label: string;
  color: string;
  x_ft: number;
  y_ft: number;
  width_ft: number;
  height_ft: number;
  created_at: string;
  updated_at: string;
}

type RemoteLoadStatus = 'not-attempted' | 'loading' | 'success' | 'failed';
type LocalDataOrigin = 'existing-local' | 'default-created' | 'remote-hydrated' | null;
type SaveBlockedReason = 'none' | 'remote-load-failed' | 'destructive-overwrite-risk' | 'not-authorized';

interface SaveLayoutOptions {
  allowDestructiveOverwrite?: boolean;
}

interface SaveLayoutResult {
  ok: boolean;
  blockedReason: SaveBlockedReason;
  deleteCount: number;
}

function createCampItemId() {
  const bytes = Crypto.getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapGridRowToConfig(row: LocalGridRow): CampGridConfig {
  return {
    tripId: row.trip_id,
    widthFt: row.width_ft,
    heightFt: row.height_ft,
    cellSizeFt: row.cell_size_ft as CellSizeValue,
    measurementUnit: row.measurement_unit,
    festivalPreset: row.festival_preset,
  };
}

function mapItemRowToItem(row: LocalItemRow): CampItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    itemType: row.item_type,
    label: row.label,
    color: row.color,
    xFt: row.x_ft,
    yFt: row.y_ft,
    widthFt: row.width_ft,
    heightFt: row.height_ft,
  };
}

function latestIsoDate(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

async function ensureDefaultLocalGrid(tripId: string) {
  const db = await getCampGridDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO camp_grids (trip_id, width_ft, height_ft, cell_size_ft, measurement_unit, festival_preset, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(trip_id) DO NOTHING`,
    [
      tripId,
      DEFAULT_GRID.widthFt,
      DEFAULT_GRID.heightFt,
      DEFAULT_GRID.cellSizeFt,
      DEFAULT_GRID.measurementUnit,
      DEFAULT_GRID.festivalPreset,
      now,
    ]
  );

  return {
    grid: {
      tripId,
      ...DEFAULT_GRID,
    },
    items: [] as CampItem[],
    updatedAt: now,
  };
}

async function readLocalSnapshot(tripId: string) {
  const db = await getCampGridDb();
  const gridRow = await db.getFirstAsync<LocalGridRow>('SELECT * FROM camp_grids WHERE trip_id = ?', [tripId]);

  const itemRows = await db.getAllAsync<LocalItemRow>('SELECT * FROM camp_items WHERE trip_id = ?', [tripId]);

  const normalizedRows: LocalItemRow[] = [];
  for (const row of itemRows) {
    if (isUuid(row.id)) {
      normalizedRows.push(row);
      continue;
    }

    const nextId = createCampItemId();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE camp_items SET id = ?, updated_at = ? WHERE id = ?', [nextId, now, row.id]);
    normalizedRows.push({
      ...row,
      id: nextId,
      updated_at: now,
    });
  }

  if (!gridRow) {
    return {
      grid: null as CampGridConfig | null,
      items: normalizedRows.map(mapItemRowToItem),
      updatedAt: latestIsoDate(...normalizedRows.map((row) => row.updated_at)),
    };
  }

  return {
    grid: mapGridRowToConfig(gridRow),
    items: normalizedRows.map(mapItemRowToItem),
    updatedAt: latestIsoDate(gridRow.updated_at, ...normalizedRows.map((row) => row.updated_at)),
  };
}

async function writeLocalSnapshot(grid: CampGridConfig, items: CampItem[], updatedAt: string) {
  const db = await getCampGridDb();

  await db.runAsync(
    `INSERT INTO camp_grids (trip_id, width_ft, height_ft, cell_size_ft, measurement_unit, festival_preset, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(trip_id) DO UPDATE SET
       width_ft = excluded.width_ft,
       height_ft = excluded.height_ft,
       cell_size_ft = excluded.cell_size_ft,
       measurement_unit = excluded.measurement_unit,
       festival_preset = excluded.festival_preset,
       updated_at = excluded.updated_at`,
    [
      grid.tripId,
      grid.widthFt,
      grid.heightFt,
      grid.cellSizeFt,
      grid.measurementUnit,
      grid.festivalPreset,
      updatedAt,
    ]
  );

  await db.runAsync('DELETE FROM camp_items WHERE trip_id = ?', [grid.tripId]);

  for (const item of items) {
    await db.runAsync(
      `INSERT INTO camp_items (id, trip_id, item_type, label, color, x_ft, y_ft, width_ft, height_ft, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.tripId,
        item.itemType,
        item.label,
        item.color,
        item.xFt,
        item.yFt,
        item.widthFt,
        item.heightFt,
        updatedAt,
        updatedAt,
      ]
    );
  }
}

async function readRemoteSnapshot(tripId: string, measurementUnit: MeasurementUnit) {
  const { data: remoteGrid, error: gridError } = await supabase
    .from('camp_grids')
    .select('trip_id, width_ft, height_ft, cell_size_ft, festival_preset, updated_at')
    .eq('trip_id', tripId)
    .maybeSingle();

  if (gridError) {
    throw gridError;
  }

  if (!remoteGrid) {
    return {
      grid: null as CampGridConfig | null,
      items: [] as CampItem[],
      updatedAt: null as string | null,
    };
  }

  const { data: remoteItems, error: itemsError } = await supabase
    .from('camp_items')
    .select(
      'id, grid_id, item_type, x, y, width_cells, height_cells, real_width_ft, real_height_ft, label, color, updated_at'
    )
    .eq('grid_id', tripId);

  if (itemsError) {
    throw itemsError;
  }

  const cellSizeFt = Number(remoteGrid.cell_size_ft) as CellSizeValue;
  const items: CampItem[] = (remoteItems ?? []).map((row: any) => ({
    id: row.id,
    tripId,
    itemType: row.item_type,
    label: row.label ?? 'Item',
    color: row.color ?? '#C9A84C',
    xFt: Number(row.x) * cellSizeFt,
    yFt: Number(row.y) * cellSizeFt,
    widthFt: Number(row.real_width_ft),
    heightFt: Number(row.real_height_ft),
  }));

  return {
    grid: {
      tripId,
      widthFt: Number(remoteGrid.width_ft),
      heightFt: Number(remoteGrid.height_ft),
      cellSizeFt,
      measurementUnit,
      festivalPreset: remoteGrid.festival_preset,
    },
    items,
    updatedAt: latestIsoDate(
      remoteGrid.updated_at,
      ...(remoteItems ?? []).map((row: any) => row.updated_at as string)
    ),
  };
}

export function useCampGridDB(tripId: string | undefined) {
  const [grid, setGrid] = useState<CampGridConfig | null>(null);
  const [items, setItems] = useState<CampItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [remoteLoadStatus, setRemoteLoadStatus] = useState<RemoteLoadStatus>('not-attempted');
  const [remoteLoadError, setRemoteLoadError] = useState<string | null>(null);
  const [localDataOrigin, setLocalDataOrigin] = useState<LocalDataOrigin>(null);
  const [pendingDestructiveDeleteCount, setPendingDestructiveDeleteCount] = useState(0);
  const { authUser, isLoading: isAuthLoading } = useAuth();

  const canLoad = Boolean(tripId);
  const canSyncWithSharedDb = Boolean(authUser?.id) && !isAuthLoading;

  const loadData = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      setError(null);
      await initCampGridDb();

      const localSnapshot = await readLocalSnapshot(tripId);
      let remoteSnapshot: Awaited<ReturnType<typeof readRemoteSnapshot>> | null = null;

      if (canSyncWithSharedDb) {
        setRemoteLoadStatus('loading');
        try {
          remoteSnapshot = await readRemoteSnapshot(
            tripId,
            localSnapshot.grid?.measurementUnit ?? DEFAULT_GRID.measurementUnit
          );
          setRemoteLoadStatus('success');
          setRemoteLoadError(null);
        } catch (remoteErr: any) {
          remoteSnapshot = null;
          setRemoteLoadStatus('failed');
          setRemoteLoadError(remoteErr?.message ?? 'Failed to load shared layout');
        }
      } else {
        setRemoteLoadStatus('not-attempted');
        setRemoteLoadError(null);
      }

      if (remoteSnapshot?.grid) {
        const shouldUseRemote =
          !localSnapshot.updatedAt ||
          new Date(remoteSnapshot.updatedAt ?? 0).getTime() >= new Date(localSnapshot.updatedAt).getTime();

        if (shouldUseRemote) {
          await writeLocalSnapshot(remoteSnapshot.grid, remoteSnapshot.items, remoteSnapshot.updatedAt ?? new Date().toISOString());
          setGrid(remoteSnapshot.grid);
          setItems(remoteSnapshot.items);
          setLocalDataOrigin('remote-hydrated');
          setHasUnsavedChanges(false);
          setLastSavedAt(remoteSnapshot.updatedAt);
          setPendingDestructiveDeleteCount(0);
          return;
        }

        if (localSnapshot.grid) {
          setGrid(localSnapshot.grid);
          setItems(localSnapshot.items);
          setLocalDataOrigin('existing-local');
          setHasUnsavedChanges(true);
          setLastSavedAt(remoteSnapshot.updatedAt);
          return;
        }
      }

      if (localSnapshot.grid) {
        setGrid(localSnapshot.grid);
        setItems(localSnapshot.items);
        setLocalDataOrigin('existing-local');
        setHasUnsavedChanges(Boolean(localSnapshot.items.length || localSnapshot.grid.festivalPreset));
        return;
      }

      const defaultSnapshot = await ensureDefaultLocalGrid(tripId);
      setGrid(defaultSnapshot.grid);
      setItems(defaultSnapshot.items);
      setLocalDataOrigin('default-created');
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load camp grid data:', err);
      setError(err?.message ?? 'Failed to load camp grid data');
    } finally {
      setIsLoading(false);
    }
  }, [canSyncWithSharedDb, tripId]);

  useEffect(() => {
    if (!canLoad) {
      setIsLoading(false);
      return;
    }

    loadData();
  }, [canLoad, loadData]);

  const upsertGrid = useCallback(
    async (partial: Partial<Omit<CampGridConfig, 'tripId'>>) => {
      if (!tripId || !grid) return;

      const nextGrid: CampGridConfig = {
        ...grid,
        ...partial,
      };
      const now = new Date().toISOString();
      setGrid(nextGrid);
      setHasUnsavedChanges(true);

      const db = await getCampGridDb();
      await db.runAsync(
        `UPDATE camp_grids
         SET width_ft = ?,
             height_ft = ?,
             cell_size_ft = ?,
             measurement_unit = ?,
             festival_preset = ?,
             updated_at = ?
         WHERE trip_id = ?`,
        [
          nextGrid.widthFt,
          nextGrid.heightFt,
          nextGrid.cellSizeFt,
          nextGrid.measurementUnit,
          nextGrid.festivalPreset,
          now,
          tripId,
        ]
      );
    },
    [grid, tripId]
  );

  const addItem = useCallback(
    async (template: CampItemTemplate, position?: { xFt: number; yFt: number }) => {
      if (!tripId || !grid) return;
      const db = await getCampGridDb();
      const now = new Date().toISOString();
      const maxX = Math.max(0, grid.widthFt - template.widthFt);
      const maxY = Math.max(0, grid.heightFt - template.heightFt);
      const centeredX = Math.max(0, (grid.widthFt - template.widthFt) / 2);
      const centeredY = Math.max(0, (grid.heightFt - template.heightFt) / 2);
      const xFt = position
        ? clamp(snapFeetToCell(position.xFt, grid.cellSizeFt), 0, maxX)
        : centeredX;
      const yFt = position
        ? clamp(snapFeetToCell(position.yFt, grid.cellSizeFt), 0, maxY)
        : centeredY;

      const newItem: CampItem = {
        id: createCampItemId(),
        tripId,
        itemType: template.itemType,
        label: template.label,
        color: template.color,
        xFt,
        yFt,
        widthFt: template.widthFt,
        heightFt: template.heightFt,
      };

      await db.runAsync(
        `INSERT INTO camp_items (id, trip_id, item_type, label, color, x_ft, y_ft, width_ft, height_ft, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newItem.id,
          newItem.tripId,
          newItem.itemType,
          newItem.label,
          newItem.color,
          newItem.xFt,
          newItem.yFt,
          newItem.widthFt,
          newItem.heightFt,
          now,
          now,
        ]
      );

      setItems((prev) => [...prev, newItem]);
      setHasUnsavedChanges(true);
    },
    [grid, tripId]
  );

  const updateItemPosition = useCallback(async (itemId: string, xFt: number, yFt: number) => {
    const db = await getCampGridDb();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE camp_items SET x_ft = ?, y_ft = ?, updated_at = ? WHERE id = ?', [
      xFt,
      yFt,
      now,
      itemId,
    ]);

    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, xFt, yFt } : item)));
    setHasUnsavedChanges(true);
  }, []);

  const rotateItem = useCallback(
    async (itemId: string) => {
      if (!grid) return;

      const currentItem = items.find((item) => item.id === itemId);
      if (!currentItem) return;

      const widthFt = currentItem.heightFt;
      const heightFt = currentItem.widthFt;
      const xFt = clamp(currentItem.xFt, 0, Math.max(0, grid.widthFt - widthFt));
      const yFt = clamp(currentItem.yFt, 0, Math.max(0, grid.heightFt - heightFt));
      const now = new Date().toISOString();
      const db = await getCampGridDb();

      await db.runAsync(
        'UPDATE camp_items SET width_ft = ?, height_ft = ?, x_ft = ?, y_ft = ?, updated_at = ? WHERE id = ?',
        [widthFt, heightFt, xFt, yFt, now, itemId]
      );

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, widthFt, heightFt, xFt, yFt } : item))
      );
      setHasUnsavedChanges(true);
    },
    [grid, items]
  );

  const deleteItem = useCallback(async (itemId: string) => {
    const db = await getCampGridDb();
    await db.runAsync('DELETE FROM camp_items WHERE id = ?', [itemId]);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setHasUnsavedChanges(true);
  }, []);

  const saveLayoutToGroup = useCallback(async (options?: SaveLayoutOptions): Promise<SaveLayoutResult> => {
    const allowDestructiveOverwrite = Boolean(options?.allowDestructiveOverwrite);

    if (!tripId || !grid || !canSyncWithSharedDb) {
      return {
        ok: false,
        blockedReason: 'not-authorized',
        deleteCount: 0,
      };
    }

    try {
      setIsSavingLayout(true);
      setError(null);

      const { data: existingRemoteItems, error: existingError } = await supabase
        .from('camp_items')
        .select('id')
        .eq('grid_id', tripId);

      if (existingError) {
        setError(existingError.message ?? 'Failed to load shared layout before saving');
        setPendingDestructiveDeleteCount(0);
        return {
          ok: false,
          blockedReason: 'remote-load-failed',
          deleteCount: 0,
        };
      }

      const localIds = new Set(items.map((item) => item.id));
      const idsToDelete = (existingRemoteItems ?? [])
        .map((row: any) => row.id as string)
        .filter((id) => !localIds.has(id));

      setPendingDestructiveDeleteCount(idsToDelete.length);

      const remoteTrustEstablished = remoteLoadStatus === 'success';
      const requiresOverwriteConfirmation =
        idsToDelete.length > 0 &&
        (!remoteTrustEstablished || localDataOrigin === 'default-created') &&
        !allowDestructiveOverwrite;

      if (requiresOverwriteConfirmation) {
        return {
          ok: false,
          blockedReason: 'destructive-overwrite-risk',
          deleteCount: idsToDelete.length,
        };
      }

      const { error: gridError } = await supabase.from('camp_grids').upsert(
        {
          trip_id: tripId,
          width_ft: grid.widthFt,
          height_ft: grid.heightFt,
          cell_size_ft: grid.cellSizeFt,
          festival_preset: grid.festivalPreset,
        },
        { onConflict: 'trip_id' }
      );

      if (gridError) {
        throw gridError;
      }

      if (idsToDelete.length) {
        const { error: deleteError } = await supabase.from('camp_items').delete().in('id', idsToDelete);
        if (deleteError) {
          throw deleteError;
        }
      }

      if (items.length) {
        const { error: itemsError } = await supabase.from('camp_items').upsert(
          items.map((item) => ({
            id: item.id,
            grid_id: tripId,
            item_type: item.itemType,
            x: Math.round(item.xFt / grid.cellSizeFt),
            y: Math.round(item.yFt / grid.cellSizeFt),
            width_cells: Math.max(1, Math.round(item.widthFt / grid.cellSizeFt)),
            height_cells: Math.max(1, Math.round(item.heightFt / grid.cellSizeFt)),
            real_width_ft: item.widthFt,
            real_height_ft: item.heightFt,
            label: item.label,
            color: item.color,
          })),
          { onConflict: 'id' }
        );

        if (itemsError) {
          throw itemsError;
        }
      }

      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toISOString());
      setPendingDestructiveDeleteCount(0);
      return {
        ok: true,
        blockedReason: 'none',
        deleteCount: idsToDelete.length,
      };
    } catch (err: any) {
      console.error('Failed to save camp grid to shared database:', err);
      setError(err?.message ?? 'Failed to save camp grid to shared database');
      return {
        ok: false,
        blockedReason: 'none',
        deleteCount: 0,
      };
    } finally {
      setIsSavingLayout(false);
    }
  }, [canSyncWithSharedDb, grid, items, localDataOrigin, remoteLoadStatus, tripId]);

  const hasConfiguredGrid = useMemo(() => Boolean(grid?.festivalPreset), [grid?.festivalPreset]);

  return {
    grid,
    items,
    isLoading,
    error,
    hasConfiguredGrid,
    hasUnsavedChanges,
    isSavingLayout,
    lastSavedAt,
    remoteLoadStatus,
    remoteLoadError,
    localDataOrigin,
    pendingDestructiveDeleteCount,
    retryRemoteLoad: loadData,
    reload: loadData,
    upsertGrid,
    addItem,
    updateItemPosition,
    rotateItem,
    deleteItem,
    saveLayoutToGroup,
  };
}
