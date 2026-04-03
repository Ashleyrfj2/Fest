/**
 * Supply List Type Definitions
 * Types and constants for the collaborative supply tracking module
 */

import { Database } from './database.types';

// Database types
export type SupplyItemRow = Database['public']['Tables']['supply_items']['Row'];
export type SupplyItemInsert = Database['public']['Tables']['supply_items']['Insert'];
export type SupplyItemUpdate = Database['public']['Tables']['supply_items']['Update'];

// Extended type with user info
export type SupplyItem = SupplyItemRow & {
  claimedByUser?: {
    id: string;
    display_name: string;
    avatar_color: string;
  } | null;
};

// Supply categories (matching database schema)
export type SupplyCategory = 
  | 'cooking'
  | 'shelter'
  | 'hygiene'
  | 'medical'
  | 'drinks'
  | 'food'
  | 'entertainment'
  | 'misc';

// Supply status workflow
export type SupplyStatus = 'unassigned' | 'claimed' | 'packed';

// Category metadata for UI
export interface CategoryMetadata {
  id: SupplyCategory;
  label: string;
  icon: string;
  color: string;
  sortOrder: number;
}

// Category definitions matching database + handoff intent
export const SUPPLY_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'shelter',
    label: 'Shelter',
    icon: '⛺',
    color: '#28C896',
    sortOrder: 1,
  },
  {
    id: 'cooking',
    label: 'Kitchen',
    icon: '🍳',
    color: '#C9A84C',
    sortOrder: 2,
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🥗',
    color: '#6D30CC',
    sortOrder: 3,
  },
  {
    id: 'drinks',
    label: 'Cooler',
    icon: '🧊',
    color: '#4A9EFF',
    sortOrder: 4,
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    icon: '🧼',
    color: '#FFB84D',
    sortOrder: 5,
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: '🏥',
    color: '#FF6B6B',
    sortOrder: 6,
  },
  {
    id: 'entertainment',
    label: 'Festival Essentials',
    icon: '🎪',
    color: '#F280B0',
    sortOrder: 7,
  },
  {
    id: 'misc',
    label: 'Misc',
    icon: '📦',
    color: '#9B8340',
    sortOrder: 8,
  },
];

// Helper to get category metadata
export function getCategoryMetadata(category: SupplyCategory): CategoryMetadata {
  return SUPPLY_CATEGORIES.find((c) => c.id === category) || SUPPLY_CATEGORIES[7]; // Default to misc
}

// Status metadata for UI
export interface StatusMetadata {
  id: SupplyStatus;
  label: string;
  color: string;
}

export const STATUS_METADATA: Record<SupplyStatus, StatusMetadata> = {
  unassigned: {
    id: 'unassigned',
    label: 'Unassigned',
    color: '#6E6880',
  },
  claimed: {
    id: 'claimed',
    label: 'Claimed',
    color: '#C9A84C',
  },
  packed: {
    id: 'packed',
    label: 'Packed',
    color: '#28C896',
  },
};

// Progress calculation helper
export interface SupplyProgress {
  total: number;
  claimed: number;
  packed: number;
  percentPacked: number;
}

export function calculateProgress(items: SupplyItem[]): SupplyProgress {
  const total = items.length;
  const claimed = items.filter((i) => i.status === 'claimed' || i.status === 'packed').length;
  const packed = items.filter((i) => i.status === 'packed').length;
  const percentPacked = total > 0 ? Math.round((packed / total) * 100) : 0;

  return { total, claimed, packed, percentPacked };
}

// Category grouping helper
export interface CategoryGroup {
  category: CategoryMetadata;
  items: SupplyItem[];
  progress: SupplyProgress;
}

export function groupByCategory(items: SupplyItem[]): CategoryGroup[] {
  const grouped = new Map<SupplyCategory, SupplyItem[]>();

  // Initialize all categories
  SUPPLY_CATEGORIES.forEach((cat) => {
    grouped.set(cat.id, []);
  });

  // Group items
  items.forEach((item) => {
    const existing = grouped.get(item.category) || [];
    grouped.set(item.category, [...existing, item]);
  });

  // Convert to sorted array of groups
  return SUPPLY_CATEGORIES.map((category) => {
    const categoryItems = grouped.get(category.id) || [];
    return {
      category,
      items: categoryItems,
      progress: calculateProgress(categoryItems),
    };
  }).filter((group) => group.items.length > 0); // Only show categories with items
}
