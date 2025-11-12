/**
 * Metrics Constants for Wasa Finance Dashboard
 * Business logic constants and calculations
 */

export const PROFIT_SHARE = {
  WASA: 0.4,
  OFFICE: 0.6,
} as const;

export const YEAR_LIMITS = {
  MIN: 2020,
  MAX: 2030,
} as const;

export const TABLE_LIMITS = {
  TOP_CUSTOMERS: 5,
  TOP_EXPENSES: 5,
} as const;

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1280,
} as const;