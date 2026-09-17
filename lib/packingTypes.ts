import { SupplyCategory } from './supplyTypes';

export type PackingSourceType = 'starter' | 'manual' | 'supply';

export type PackingCategory =
  | 'shelter'
  | 'festival_gear'
  | 'clothing'
  | 'hygiene'
  | 'medical'
  | 'kitchen'
  | 'comfort';

export interface PackingAssignedUser {
  id: string;
  display_name: string;
  avatar_color: string;
}

export type PackingItem = {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  is_group_item: boolean;
  assigned_to: string | null;
  source_type: PackingSourceType;
  source_supply_item_id: string | null;
  packed: boolean;
  created_at: string;
  updated_at: string;
};

export type PackingItemInsert = {
  trip_id: string;
  user_id?: string;
  name: string;
  category: PackingCategory;
  quantity?: number;
  is_group_item?: boolean;
  assigned_to?: string | null;
  source_type?: PackingSourceType;
  source_supply_item_id?: string | null;
  packed?: boolean;
};

export type PackingItemUpdate = Partial<Omit<PackingItem, 'id' | 'trip_id' | 'user_id' | 'created_at'>>;

export type PackingCheck = {
  id: string;
  packing_item_id: string;
  user_id: string;
  packed: boolean;
  created_at: string;
  updated_at: string;
};

export type PackingCheckInsert = {
  packing_item_id: string;
  user_id: string;
  packed: boolean;
};

export type PackingItemWithState = PackingItem & {
  packed: boolean;
  assignedToUser: PackingAssignedUser | null;
};

export type CategoryProgress = {
  category: PackingCategory;
  total: number;
  packed: number;
};

export type PackingCategoryMeta = {
  id: PackingCategory;
  label: string;
  sortOrder: number;
};

export const PACKING_CATEGORIES: PackingCategoryMeta[] = [
  { id: 'shelter', label: 'Shelter', sortOrder: 1 },
  { id: 'festival_gear', label: 'Festival Gear', sortOrder: 2 },
  { id: 'clothing', label: 'Clothing', sortOrder: 3 },
  { id: 'hygiene', label: 'Hygiene', sortOrder: 4 },
  { id: 'medical', label: 'Medical', sortOrder: 5 },
  { id: 'kitchen', label: 'Kitchen', sortOrder: 6 },
  { id: 'comfort', label: 'Comfort', sortOrder: 7 },
];

export function getPackingCategoryMeta(category: PackingCategory): PackingCategoryMeta {
  return PACKING_CATEGORIES.find((item) => item.id === category) ?? PACKING_CATEGORIES[0];
}

export function groupByCategory(
  items: PackingItemWithState[]
): Record<PackingCategory, PackingItemWithState[]> {
  const grouped = PACKING_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = [];
    return acc;
  }, {} as Record<PackingCategory, PackingItemWithState[]>);

  items.forEach((item) => {
    const category = item.category as PackingCategory;
    (grouped[category] ?? grouped.festival_gear).push(item);
  });

  return grouped;
}

export function calculateCategoryProgress(items: PackingItemWithState[]): CategoryProgress[] {
  const grouped = groupByCategory(items);

  return PACKING_CATEGORIES.map((category) => {
    const categoryItems = grouped[category.id];
    const packed = categoryItems.filter((item) => item.packed).length;

    return {
      category: category.id,
      total: categoryItems.length,
      packed,
    };
  });
}

export function mapSupplyCategoryToPackingCategory(category: SupplyCategory): PackingCategory {
  switch (category) {
    case 'shelter':
      return 'shelter';
    case 'cooking':
    case 'food':
    case 'drinks':
      return 'kitchen';
    case 'hygiene':
      return 'hygiene';
    case 'medical':
      return 'medical';
    case 'entertainment':
      return 'festival_gear';
    case 'misc':
    default:
      return 'festival_gear';
  }
}
