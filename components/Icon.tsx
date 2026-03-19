/**
 * Icon Component
 *
 * Wrapper around Lucide React Native icons with design system integration
 * Use this instead of importing Lucide icons directly to ensure consistent styling
 */

import { ComponentProps } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '@/lib/tokens';

// Map of icon names to Lucide components
const iconMap = {
  calendar: Calendar,
  check: Check,
  checkCircle: CheckCircle2,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  clock: Clock,
  home: Home,
  mapPin: MapPin,
  message: MessageCircle,
  plus: Plus,
  search: Search,
  settings: Settings,
  shoppingBag: ShoppingBag,
  sparkles: Sparkles,
  trending: TrendingUp,
  user: User,
  users: Users,
  x: X,
  zap: Zap,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  color = colors.text.mid,
  strokeWidth = 2,
}: IconProps) {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}
