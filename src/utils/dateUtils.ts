/**
 * Universal Date Utilities for Wasa Finance System
 * Handles all date format conversions consistently
 */

export type DateInput = Date | string | { toDate: () => Date } | null | undefined;

/**
 * Universal date formatter that handles all input types
 * - Firebase Timestamp: { toDate: () => Date }
 * - JavaScript Date: Date
 * - ISO String: string
 * - Null/Undefined: null/undefined
 */
export const formatDate = (dateInput: DateInput, format: 'short' | 'long' | 'datetime' = 'short'): string => {
  if (!dateInput) return '-';

  try {
    let date: Date;

    // Handle Firebase Timestamp
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    }
    // Handle Date object
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Handle string
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    }
    else {
      console.warn('Invalid date format:', dateInput);
      return '-';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateInput);
      return '-';
    }

    // Format based on requested format
    switch (format) {
      case 'long':
        return date.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'datetime':
        return date.toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'short':
      default:
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateInput);
    return '-';
  }
};

/**
 * Convert any date input to JavaScript Date object
 */
export const toDate = (dateInput: DateInput): Date | null => {
  if (!dateInput) return null;

  try {
    // Handle Firebase Timestamp
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    // Handle Date object
    else if (dateInput instanceof Date) {
      return dateInput;
    }
    // Handle string
    else if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    else {
      console.warn('Invalid date format for toDate:', dateInput);
      return null;
    }
  } catch (error) {
    console.error('Error converting date:', error, 'Input:', dateInput);
    return null;
  }
};

/**
 * Check if a date is within a specific month and year
 */
export const isDateInMonth = (dateInput: DateInput, targetMonth: number, targetYear: number): boolean => {
  const date = toDate(dateInput);
  if (!date) return false;

  return date.getMonth() + 1 === targetMonth && date.getFullYear() === targetYear;
};

/**
 * Get month name in Indonesian
 */
export const getMonthName = (month: number, format: 'long' | 'short' = 'long'): string => {
  const months = {
    long: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  };

  return months[format][month - 1] || 'Tidak Diketahui';
};

/**
 * Format currency with Indonesian locale
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get relative time (e.g., "2 hari yang lalu", "Kemarin")
 */
export const getRelativeTime = (dateInput: DateInput): string => {
  const date = toDate(dateInput);
  if (!date) return '-';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hari ini';
  } else if (diffDays === 1) {
    return 'Kemarin';
  } else if (diffDays < 7) {
    return `${diffDays} hari yang lalu`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} minggu yang lalu`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} bulan yang lalu`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} tahun yang lalu`;
  }
};

/**
 * Create date range for a given month and year
 */
export const createMonthRange = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return { start, end };
};

/**
 * Check if date is within range
 */
export const isDateInRange = (dateInput: DateInput, start: Date, end: Date): boolean => {
  const date = toDate(dateInput);
  if (!date) return false;

  return date >= start && date <= end;
};