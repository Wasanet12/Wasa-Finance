/**
 * Centralized Type Definitions for Wasa Finance System
 * All TypeScript interfaces and types used across the application
 */

// ==================== CUSTOMER TYPES ====================

export interface Customer {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;

  // Package Information
  packageId: string;
  packageName: string;
  packagePrice: number;
  originalPrice: number;
  discountAmount: number;
  discountPercentage?: number;
  discount?: number; // Total discount percentage for reporting
  finalPrice?: number;

  // Payment Information
  status: 'active' | 'inactive' | 'Belum Bayar' | 'pending';
  paymentTarget: 'Wasa' | 'Kantor';
  paymentMethod?: 'cash' | 'transfer' | 'e-wallet' | 'credit_card';
  paymentDate?: Date;
  paymentNotes?: string;

  // Dates
  createdAt: Date;
  updatedAt: Date;
  inactiveSince?: Date;

  // Additional Fields
  notes?: string;
  referralCode?: string;
  referredBy?: string;
}

// ==================== PACKAGE TYPES ====================

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in months
  features: string[];
  isActive: boolean;

  // Dates
  createdAt: Date;
  updatedAt: Date;

  // Additional Fields
  maxUsers?: number;
  trialDays?: number;
}

// ==================== EXPENSE TYPES ====================

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;

  // Dates
  date: Date;
  createdAt: Date;
  updatedAt: Date;

  // Payment Information
  paymentMethod?: string;
  receiptNumber?: string;
  vendorName?: string;

  
  // Additional Fields
  notes?: string;
  attachments?: string[];
  tags?: string[];
}

// ==================== PAYMENT TYPES ====================

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  packageId: string;
  packageName: string;

  // Payment Amount
  amount: number;
  originalAmount: number;
  discountAmount: number;

  // Payment Method
  method: 'cash' | 'transfer' | 'e-wallet' | 'credit_card';
  target: 'Wasa' | 'Kantor';

  // Dates
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Transaction Details
  transactionId?: string;
  bankName?: string;
  accountNumber?: string;

  // Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';

  // Additional Fields
  notes?: string;
  processedBy?: string;
}

// ==================== REPORT TYPES ====================

export interface Report {
  id: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  title: string;
  description?: string;

  // Period
  startDate: Date;
  endDate: Date;

  // Report Data (JSON string)
  data: {
    totalRevenue: number;
    wasaRevenue: number;
    officeRevenue: number;
    totalExpenses: number;
    wasaNetProfit: number;
    customerCounts: {
      total: number;
      active: number;
      inactive: number;
      paid: number;
      unpaid: number;
    };
    // Additional metrics...
  };

  // File Information
  fileName: string;
  fileUrl?: string;
  fileSize?: number;

  // Dates
  createdAt: Date;
  generatedBy: string;

  // Additional Fields
  filters?: {
    month?: number;
    year?: number;
    categories?: string[];
    status?: string[];
  };
}

// ==================== SETTINGS TYPES ====================

export interface Settings {
  id: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object';
  description?: string;

  // Dates
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

// ==================== DASHBOARD METRICS ====================

export interface DashboardMetrics {
  totalRevenue: number;
  wasaRevenue: number;
  officeRevenue: number;
  totalExpenses: number;
  wasaNetProfit: number;
  customerCounts: {
    total: number;
    active: number;
    inactive: number;
    paid: number;
    unpaid: number;
  };
  paymentBreakdown: {
    wasa: { count: number; total: number };
    kantor: { count: number; total: number };
  };
  monthlyGrowth?: {
    revenue: number;
    customers: number;
    expenses: number;
  };
}

// ==================== AUTHENTICATION TYPES ====================

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== QUERY OPTIONS ====================

export interface QueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: {
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'array-contains';
    value: unknown;
  }[];
}

// ==================== FORM TYPES ====================

export interface CustomerFormData {
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice?: number;
  status: 'active' | 'inactive' | 'Belum Bayar' | 'pending';
  paymentTarget: 'Wasa' | 'Kantor';
  paymentMethod?: 'cash' | 'transfer' | 'e-wallet' | 'credit_card';
  paymentDate?: Date;
  paymentNotes?: string;
  notes?: string;
}

export interface PackageFormData {
  name: string;
  description?: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  maxUsers?: number;
  trialDays?: number;
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  vendorName?: string;
  notes?: string;
  tags?: string[];
}

// ==================== PDF REPORT DATA ====================

export interface PDFReportData {
  customers: Customer[];
  expenses: Expense[];
  selectedMonth: number;
  selectedYear: number;
  totalRevenue: number;
  totalRevenueBeforeDiscount: number;
  wasaProfit: number;
  wasaProfitBeforeDiscount: number;
  officeProfit: number;
  totalExpenses: number;
  wasaNetProfit: number;
  wasaNetProfitBeforeDiscount: number;
  totalDiscount: number;
  totalActiveCustomers: number;
  paidCustomers: number;
  unpaidCustomers: number;
  customersPayToWasa: number;
  customersPayToOffice: number;
  totalPaymentToWasa: number;
  totalPaymentToOffice: number;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  userId?: string;
}

// ==================== FILTER TYPES ====================

export interface FilterOptions {
  month?: number;
  year?: number;
  status?: string[];
  category?: string[];
  paymentTarget?: string[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ==================== EXPORT ALL TYPES ====================

export type {
  // Re-export for convenience
  Customer as ICustomer,
  Package as IPackage,
  Expense as IExpense,
  Payment as IPayment,
  Report as IReport,
  Settings as ISettings,
  User as IUser,
  AuthState as IAuthState,
  DashboardMetrics as IDashboardMetrics,
  ApiResponse as IApiResponse,
  QueryOptions as IQueryOptions,
  CustomerFormData as ICustomerFormData,
  PackageFormData as IPackageFormData,
  ExpenseFormData as IExpenseFormData,
  PDFReportData as IPDFReportData,
  Notification as INotification,
  FilterOptions as IFilterOptions
};