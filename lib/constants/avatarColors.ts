export const AVATAR_COLORS = [
  { name: 'Gold', hex: '#C9A84C' },
  { name: 'Electric Green', hex: '#28C896' },
  { name: 'Violet', hex: '#6D30CC' },
  { name: 'Hot Pink', hex: '#F280B0' },
  { name: 'Sky Blue', hex: '#4A9EFF' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Amber', hex: '#FFB84D' },
  { name: 'Lavender', hex: '#B47AFF' },
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];