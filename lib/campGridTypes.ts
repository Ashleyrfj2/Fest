export type MeasurementUnit = 'ft' | 'm';
export type CellSizeValue = 0.5 | 1 | 1.5;

export interface CampGridConfig {
  tripId: string;
  widthFt: number;
  heightFt: number;
  cellSizeFt: CellSizeValue;
  measurementUnit: MeasurementUnit;
  festivalPreset: string | null;
}

export interface CampItem {
  id: string;
  tripId: string;
  itemType: 'tent' | 'canopy' | 'car' | 'table' | 'cooler' | 'fire_pit' | 'path' | 'custom';
  label: string;
  color: string;
  xFt: number;
  yFt: number;
  widthFt: number;
  heightFt: number;
}

export interface CampItemTemplate {
  itemType: CampItem['itemType'];
  label: string;
  color: string;
  widthFt: number;
  heightFt: number;
}

export const FEET_TO_METERS = 0.3048;

export function toDisplayUnit(valueFt: number, unit: MeasurementUnit): number {
  if (unit === 'm') return valueFt * FEET_TO_METERS;
  return valueFt;
}

export function fromDisplayUnit(value: number, unit: MeasurementUnit): number {
  if (unit === 'm') return value / FEET_TO_METERS;
  return value;
}

export function formatDimension(valueFt: number, unit: MeasurementUnit): string {
  const displayValue = toDisplayUnit(valueFt, unit);
  const fixed = unit === 'm' ? displayValue.toFixed(1) : displayValue.toFixed(1);
  return `${fixed}${unit}`;
}

export function snapFeetToCell(valueFt: number, cellSizeFt: CellSizeValue): number {
  return Math.round(valueFt / cellSizeFt) * cellSizeFt;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
