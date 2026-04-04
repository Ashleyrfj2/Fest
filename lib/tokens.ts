/**
 * FestNest Design System Tokens
 *
 * All design tokens defined per CLAUDE.md and docs/product/ui-decisions.md
 * Never use hardcoded values in components — always reference these tokens
 */

export const colors = {
  // Base
  base: '#0E0C16',

  // Surfaces (layered depth)
  surface: {
    level1: '#151220',
    level2: '#1C1829',
    level3: '#252033',
  },

  // Primary accent
  accent: {
    gold: '#C9A84C',
    goldDim: '#9B8340',
    goldBright: '#E5C96E',
  },

  // Text hierarchy
  text: {
    primary: '#EAE6DE',
    mid: '#A9A2B4',
    dim: '#6E6880',
    faint: '#3E3950',
  },

  // Borders (extremely subtle)
  border: {
    subtle: 'rgba(255, 255, 255, 0.03)',
    medium: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.1)',
  },

  // Festival identity colors
  festival: {
    electricForest: {
      dark: '#0A4D3A',
      mid: '#12785A',
      bright: '#28C896',
    },
    dancefestopia: {
      dark: '#3B1578',
      mid: '#6D30CC',
      bright: '#B47AFF',
    },
    beyondWonderland: {
      dark: '#7A1048',
      mid: '#C42070',
      bright: '#F280B0',
    },
  },

  // Semantic colors
  success: '#28C896',
  warning: '#E5C96E',
  danger: '#FF6B6B',
} as const;

export const typography = {
  // Font sizes (converted from px to React Native scale)
  size: {
    appTitle: 26,
    cardTitle: 17,
    body: 13,
    label: 11,
    meta: 10,
  },

  // Font weights
  weight: {
    headline: '800' as const,
    cardTitle: '700' as const,
    label: '600' as const,
    body: '400' as const,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 1.4,
  },

  // Line heights (relative to font size)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  // Soft glow effect for cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Subtle depth
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

// Common component styles
export const components = {
  avatar: {
    borderRadius: borderRadius.md, // Rounded squares, not circles
  },

  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },

  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
} as const;
