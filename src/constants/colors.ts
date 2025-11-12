/**
 * Color Constants for Wasa Finance Dashboard
 * Centralized color management for consistent theming
 */

export const COLORS = {
  // Primary Colors
  PRIMARY: '#1B2336',
  SECONDARY: '#3D4558',
  BACKGROUND: '#0F1725',

  // Border & Surface
  BORDER: '#1E293B',
  SURFACE: '#1E293B',

  // Text Colors
  WHITE: '#FFFFFF',
  MUTED: '#94A3B8',
  SUBTLE: '#64748B',

  // Status Colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',

  // Accent Colors
  ACCENT_BLUE: '#3B82F620',
  ACCENT_GREEN: '#10B98120',
  ACCENT_YELLOW: '#FCD34D',
  ACCENT_PURPLE: '#A5B4FC',

  // Rank Colors
  RANK_GOLD: '#FCD34D',
  RANK_SILVER: '#A5B4FC',
  RANK_BRONZE: '#94A3B8',

  // Chart Colors
  CHART_BLUE: '#3B82F6',
  CHART_RED: '#EF4444',
  CHART_GREEN: '#10B981',
  CHART_GRAY: '#6B7280',
  CHART_ORANGE: '#F59E0B',
  CHART_CYAN: '#06B6D4',
  CHART_PURPLE: '#8B5CF6',
} as const;

export type ColorKey = keyof typeof COLORS;