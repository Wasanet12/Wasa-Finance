/**
 * Spacing Constants for Wasa Finance Dashboard
 * Consistent spacing patterns throughout the application
 */

export const SPACING = {
  // Card Padding
  CARD_HEADER: 'pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4',
  CARD_CONTENT: 'px-3 sm:px-4 pb-4 sm:pb-5',
  TABLE_CARD_HEADER: 'pb-3 sm:pb-4 px-3 sm:px-4 pt-4 sm:pt-5',
  TABLE_CELL: 'py-2.5 px-2 sm:py-4 sm:px-5',

  // Container Padding
  CONTAINER_MOBILE: 'px-3 sm:px-4 lg:px-6',
  CONTAINER_DESKTOP: 'px-4 sm:px-6 lg:px-8',

  // Section Spacing
  SECTION_GAP: 'gap-3 sm:gap-4 lg:gap-6',
  SECTION_SPACING: 'space-y-4 sm:space-y-6 lg:space-y-8',

  // Grid Spacing
  GRID_GAP: 'gap-3 sm:gap-4 lg:gap-6',

  // Header Spacing
  HEADER_CONTAINER: 'gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6',
  HEADER_ITEMS: 'space-x-2 sm:space-x-3',

  // Responsive Grids
  GRID_METRICS: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  GRID_TABLES: 'grid-cols-1 xl:grid-cols-2',
  GRID_SINGLE: 'grid-cols-1',
} as const;

export type SpacingKey = keyof typeof SPACING;