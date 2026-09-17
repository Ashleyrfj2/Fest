export interface FestivalDimensionOption {
  id: string;
  label: string;
  widthFt: number;
  heightFt: number;
}

export interface FestivalCampingPreset {
  festivalName: string;
  options: FestivalDimensionOption[];
}

// Source of truth: docs/Festival-dimensions.md
export const FESTIVAL_CAMPING_PRESETS: FestivalCampingPreset[] = [
  {
    festivalName: 'Electric Forest',
    options: [
      { id: 'ef-car-standard', label: 'GA Car Camping (12 x 30)', widthFt: 12, heightFt: 30 },
      { id: 'ef-car-usable', label: 'GA Usable Tent Area (12 x 20)', widthFt: 12, heightFt: 20 },
      { id: 'ef-tent-only', label: 'Tent Only (12 x 12)', widthFt: 12, heightFt: 12 },
      { id: 'manual', label: 'Manual Dimensions', widthFt: 20, heightFt: 20 },
    ],
  },
  {
    festivalName: 'Lost Lands',
    options: [
      { id: 'll-car', label: 'Car Camping (12 x 30)', widthFt: 12, heightFt: 30 },
      { id: 'll-tent', label: 'Tent Only (10 x 10)', widthFt: 10, heightFt: 10 },
      { id: 'manual', label: 'Manual Dimensions', widthFt: 20, heightFt: 20 },
    ],
  },
  {
    festivalName: 'EDC Las Vegas (Camp EDC)',
    options: [
      { id: 'edc-tent-site', label: 'Tent Site (~10 x 30)', widthFt: 10, heightFt: 30 },
      { id: 'manual', label: 'Manual Dimensions', widthFt: 20, heightFt: 20 },
    ],
  },
  {
    festivalName: 'Imagine Music Festival',
    options: [
      { id: 'imf-car', label: 'Car Camping (~20 x 20)', widthFt: 20, heightFt: 20 },
      { id: 'imf-tent', label: 'Tent Only (~12 x 15)', widthFt: 12, heightFt: 15 },
      { id: 'manual', label: 'Manual Dimensions', widthFt: 20, heightFt: 20 },
    ],
  },
];

export function getFestivalPresetByName(festivalName: string): FestivalCampingPreset | null {
  const festival = FESTIVAL_CAMPING_PRESETS.find((preset) =>
    preset.festivalName.toLowerCase().includes(festivalName.toLowerCase()) ||
    festivalName.toLowerCase().includes(preset.festivalName.toLowerCase())
  );
  return festival ?? null;
}
