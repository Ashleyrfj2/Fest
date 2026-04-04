import { Database } from './database.types';

export type PackingItem = Database['public']['Tables']['packing_items']['Row'];
export type PackingItemInsert = Database['public']['Tables']['packing_items']['Insert'];
export type PackingItemUpdate = Database['public']['Tables']['packing_items']['Update'];

export type PackingCheck = Database['public']['Tables']['packing_checks']['Row'];
export type PackingCheckInsert = Database['public']['Tables']['packing_checks']['Insert'];

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
    grouped[item.category as PackingCategory].push(item);
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
