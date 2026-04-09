export interface FestivalTripOption {
  name: string;
  startDate: string;
  endDate: string;
}

const normalizeFestivalName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b20\d{2}\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ') 
    .trim();

export const POPULAR_FESTIVAL_OPTIONS: FestivalTripOption[] = [
  { name: 'Electric Forest', startDate: '2026-06-19', endDate: '2026-06-22' },
  { name: 'Dancefestopia', startDate: '2026-09-04', endDate: '2026-09-06' },
  { name: 'Beyond Wonderland PNW', startDate: '2026-07-11', endDate: '2026-07-13' },
  { name: 'Bonnaroo', startDate: '2026-06-11', endDate: '2026-06-14' },
  { name: 'Lightning in a Bottle', startDate: '2026-05-20', endDate: '2026-05-25' },
  { name: 'Okeechobee', startDate: '2026-03-19', endDate: '2026-03-22' },
  { name: 'Shambhala', startDate: '2026-07-24', endDate: '2026-07-27' },
  { name: 'Wookan', startDate: '2026-08-14', endDate: '2026-08-16' },
  { name: 'Lost Lands', startDate: '2026-09-18', endDate: '2026-09-20' },
  { name: 'Elements Lakewood', startDate: '2026-08-07', endDate: '2026-08-09' },
];

export function getFestivalTripOption(festivalName: string): FestivalTripOption | null {
  const normalized = normalizeFestivalName(festivalName);

  if (!normalized) {
    return null;
  }

  return (
    POPULAR_FESTIVAL_OPTIONS.find((option) => {
      const optionName = normalizeFestivalName(option.name);
      return optionName === normalized || optionName.includes(normalized) || normalized.includes(optionName);
    }) ?? null
  );
}

export function formatFestivalDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  return `${formatDate(start)} – ${formatDate(end)}`;
}