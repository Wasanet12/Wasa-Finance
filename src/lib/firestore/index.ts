/**
 * Firestore Database Operations
 * Centralized CRUD operations for Wasa Finance System
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type {
  Customer,
  Package,
  Expense,
  Payment,
  Report,
  Settings,
  QueryOptions,
  ApiResponse
} from '@/lib/types';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert JavaScript Date to Firebase Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Convert Firebase Timestamp to JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Create document with auto-generated ID
 */
export const createDocument = async <T>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<string>> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return {
      success: true,
      data: docRef.id,
      message: 'Document created successfully'
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get all documents from collection
 */
export const getAllDocuments = async <T>(
  collectionName: string,
  options?: QueryOptions
): Promise<ApiResponse<T[]>> => {
  try {
    let q = query(collection(db, collectionName));

    // Apply where clauses
    if (options?.where) {
      options.where.forEach(whereClause => {
        q = query(q, where(whereClause.field, whereClause.operator, whereClause.value));
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }

    // Apply limit
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      success: true,
      data: documents
    };
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get single document by ID
 */
export const getDocumentById = async <T>(
  collectionName: string,
  id: string
): Promise<ApiResponse<T | null>> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() } as T
      };
    }
    return {
      success: true,
      data: null,
      message: 'Document not found'
    };
  } catch (error) {
    console.error(`Error getting document ${id} from ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Update document
 */
export const updateDocument = async <T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<ApiResponse<void>> => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return {
      success: true,
      message: 'Document updated successfully'
    };
  } catch (error) {
    console.error(`Error updating document ${id} in ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<ApiResponse<void>> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return {
      success: true,
      message: 'Document deleted successfully'
    };
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// ==================== COLLECTION NAMES ====================

export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  PACKAGES: 'packages',
  EXPENSES: 'expenses',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  USERS: 'users'
} as const;

// ==================== CUSTOMER OPERATIONS ====================

export const customerService = {
  /**
   * Add new customer
   */
  create: async (customer: Omit<Customer, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.CUSTOMERS, customer);
  },

  /**
   * Get all customers
   */
  getAll: async (options?: QueryOptions): Promise<ApiResponse<Customer[]>> => {
    const defaultOptions: QueryOptions = {
      orderBy: { field: 'createdAt', direction: 'desc' },
      ...options
    };
    return getAllDocuments<Customer>(COLLECTIONS.CUSTOMERS, defaultOptions);
  },

  /**
   * Get customer by ID
   */
  getById: async (id: string): Promise<ApiResponse<Customer | null>> => {
    return getDocumentById<Customer>(COLLECTIONS.CUSTOMERS, id);
  },

  /**
   * Update customer
   */
  update: async (id: string, customer: Partial<Customer>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.CUSTOMERS, id, customer);
  },

  /**
   * Delete customer
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return deleteDocument(COLLECTIONS.CUSTOMERS, id);
  },

  /**
   * Get customers by status (Optimized with server-side filtering)
   */
  getByStatus: async (status: Customer['status']): Promise<ApiResponse<Customer[]>> => {
    return getCustomersByStatus(status);
  },

  /**
   * Get customers by payment target (Optimized with server-side filtering)
   */
  getByPaymentTarget: async (paymentTarget: Customer['paymentTarget']): Promise<ApiResponse<Customer[]>> => {
    return getCustomersByPaymentTarget(paymentTarget);
  },

  /**
   * Get customers by month and year
   */
  getByMonth: async (month: number, year: number): Promise<ApiResponse<Customer[]>> => {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

      // Get all customers ordered by creation date, then filter by date range
      const allCustomers = await getAllDocuments<Customer>(COLLECTIONS.CUSTOMERS, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      if (allCustomers.success && allCustomers.data) {
        // Filter by date range on client side
        const filteredCustomers = allCustomers.data.filter(customer => {
          const customerDate = customer.createdAt;
          return customerDate >= startDate && customerDate <= endDate;
        });
        console.log(`Found ${filteredCustomers.length} customers for ${month}/${year}`);
        return {
          success: true,
          data: filteredCustomers
        };
      }

      return allCustomers;
    } catch (error: any) {
      console.error('Error fetching customers by month:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers by month'
      };
    }
  },

  /**
   * Search customers by name or phone
   */
  search: async (searchTerm: string): Promise<ApiResponse<Customer[]>> => {
    try {
      const allCustomers = await customerService.getAll();
      if (!allCustomers.success || !allCustomers.data) {
        return {
          success: false,
          error: 'Failed to fetch customers'
        };
      }

      const filteredCustomers = allCustomers.data.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phoneNumber && customer.phoneNumber.includes(searchTerm))
      );

      return {
        success: true,
        data: filteredCustomers
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
};

// ==================== PACKAGE OPERATIONS ====================

export const packageService = {
  /**
   * Add new package
   */
  create: async (pkg: Omit<Package, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.PACKAGES, pkg);
  },

  /**
   * Get all active packages
   */
  getActive: async (): Promise<ApiResponse<Package[]>> => {
    return getActivePackages();
  },

  /**
   * Get all packages (including inactive)
   */
  getAll: async (): Promise<ApiResponse<Package[]>> => {
    const options: QueryOptions = {
      orderBy: { field: 'createdAt', direction: 'desc' }
    };
    return getAllDocuments<Package>(COLLECTIONS.PACKAGES, options);
  },

  /**
   * Get package by ID
   */
  getById: async (id: string): Promise<ApiResponse<Package | null>> => {
    return getDocumentById<Package>(COLLECTIONS.PACKAGES, id);
  },

  /**
   * Update package
   */
  update: async (id: string, pkg: Partial<Package>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.PACKAGES, id, pkg);
  },

  /**
   * Delete package
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return deleteDocument(COLLECTIONS.PACKAGES, id);
  }
};

// ==================== EXPENSE OPERATIONS ====================

export const expenseService = {
  /**
   * Add new expense
   */
  create: async (expense: Omit<Expense, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.EXPENSES, expense);
  },

  /**
   * Get all expenses
   */
  getAll: async (options?: QueryOptions): Promise<ApiResponse<Expense[]>> => {
    const defaultOptions: QueryOptions = {
      orderBy: { field: 'date', direction: 'desc' },
      ...options
    };
    return getAllDocuments<Expense>(COLLECTIONS.EXPENSES, defaultOptions);
  },

  /**
   * Get expense by ID
   */
  getById: async (id: string): Promise<ApiResponse<Expense | null>> => {
    return getDocumentById<Expense>(COLLECTIONS.EXPENSES, id);
  },

  /**
   * Update expense
   */
  update: async (id: string, expense: Partial<Expense>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.EXPENSES, id, expense);
  },

  /**
   * Delete expense
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return deleteDocument(COLLECTIONS.EXPENSES, id);
  },

  /**
   * Get expenses by month and year
   */
  getByMonth: async (month: number, year: number): Promise<ApiResponse<Expense[]>> => {
    try {
      const startDate = dateToTimestamp(new Date(year, month - 1, 1));
      const endDate = dateToTimestamp(new Date(year, month, 0, 23, 59, 59)); // Last day of month

      return getExpensesByDateRange(startDate, endDate);
    } catch (error: any) {
      console.error('Error fetching expenses by month:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch expenses by month'
      };
    }
  },

  /**
   * Get expenses by category
   */
  getByCategory: async (category: string): Promise<ApiResponse<Expense[]>> => {
    const options: QueryOptions = {
      where: [{ field: 'category', operator: '==', value: category }],
      orderBy: { field: 'date', direction: 'desc' }
    };
    return getAllDocuments<Expense>(COLLECTIONS.EXPENSES, options);
  },

  };

// ==================== PAYMENT OPERATIONS ====================

export const paymentService = {
  /**
   * Add new payment
   */
  create: async (payment: Omit<Payment, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.PAYMENTS, payment);
  },

  /**
   * Get all payments
   */
  getAll: async (options?: QueryOptions): Promise<ApiResponse<Payment[]>> => {
    const defaultOptions: QueryOptions = {
      orderBy: { field: 'paymentDate', direction: 'desc' },
      ...options
    };
    return getAllDocuments<Payment>(COLLECTIONS.PAYMENTS, defaultOptions);
  },

  /**
   * Get payment by ID
   */
  getById: async (id: string): Promise<ApiResponse<Payment | null>> => {
    return getDocumentById<Payment>(COLLECTIONS.PAYMENTS, id);
  },

  /**
   * Update payment
   */
  update: async (id: string, payment: Partial<Payment>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.PAYMENTS, id, payment);
  },

  /**
   * Delete payment
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return deleteDocument(COLLECTIONS.PAYMENTS, id);
  },

  /**
   * Get payments by month
   */
  getByMonth: async (month: number, year: number): Promise<ApiResponse<Payment[]>> => {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all payments ordered by payment date, then filter by date range
      const allPayments = await getAllDocuments<Payment>(COLLECTIONS.PAYMENTS, {
        orderBy: { field: 'paymentDate', direction: 'desc' }
      });

      if (allPayments.success && allPayments.data) {
        // Filter by date range on client side
        const filteredPayments = allPayments.data.filter(payment => {
          const paymentDate = payment.paymentDate;
          return paymentDate >= startDate && paymentDate <= endDate;
        });
        console.log(`Found ${filteredPayments.length} payments for ${month}/${year}`);
        return {
          success: true,
          data: filteredPayments
        };
      }

      return allPayments;
    } catch (error: any) {
      console.error('Error fetching payments by month:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payments by month'
      };
    }
  }
};

// ==================== REPORT OPERATIONS ====================

export const reportService = {
  /**
   * Add new report
   */
  create: async (report: Omit<Report, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.REPORTS, report);
  },

  /**
   * Get all reports
   */
  getAll: async (options?: QueryOptions): Promise<ApiResponse<Report[]>> => {
    const defaultOptions: QueryOptions = {
      orderBy: { field: 'createdAt', direction: 'desc' },
      ...options
    };
    return getAllDocuments<Report>(COLLECTIONS.REPORTS, defaultOptions);
  },

  /**
   * Get report by ID
   */
  getById: async (id: string): Promise<ApiResponse<Report | null>> => {
    return getDocumentById<Report>(COLLECTIONS.REPORTS, id);
  },

  /**
   * Update report
   */
  update: async (id: string, report: Partial<Report>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.REPORTS, id, report);
  },

  /**
   * Delete report
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return deleteDocument(COLLECTIONS.REPORTS, id);
  }
};

// ==================== SETTINGS OPERATIONS ====================

export const settingsService = {
  /**
   * Add new setting
   */
  create: async (setting: Omit<Settings, 'id'>): Promise<ApiResponse<string>> => {
    return createDocument(COLLECTIONS.SETTINGS, setting);
  },

  /**
   * Get setting by key
   */
  getByKey: async (key: string): Promise<ApiResponse<Settings | null>> => {
    const options: QueryOptions = {
      where: [{ field: 'key', operator: '==', value: key }]
    };
    const result = await getAllDocuments<Settings>(COLLECTIONS.SETTINGS, options);

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    }

    return {
      success: true,
      data: null,
      message: 'Setting not found'
    };
  },

  /**
   * Update setting
   */
  update: async (id: string, setting: Partial<Settings>): Promise<ApiResponse<void>> => {
    return updateDocument(COLLECTIONS.SETTINGS, id, setting);
  },

  /**
   * Update setting by key
   */
  updateByKey: async (key: string, value: any): Promise<ApiResponse<void>> => {
    const existing = await settingsService.getByKey(key);
    if (existing.success && existing.data) {
      return updateDocument(COLLECTIONS.SETTINGS, existing.data.id, { value });
    }
    return {
      success: false,
      error: 'Setting not found'
    };
  }
};

// ==================== OPTIMIZED QUERY FUNCTIONS ====================

/**
 * Optimized query for customers with server-side filtering
 */
export const getCustomersByStatus = async (status: string): Promise<ApiResponse<Customer[]>> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];

    console.log(`Retrieved ${customers.length} customers with status '${status}'`);
    return {
      success: true,
      data: customers
    };
  } catch (error) {
    console.error(`Error getting customers by status '${status}':`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Optimized query for customers by payment target
 */
export const getCustomersByPaymentTarget = async (paymentTarget: string): Promise<ApiResponse<Customer[]>> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('paymentTarget', '==', paymentTarget),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];

    console.log(`Retrieved ${customers.length} customers with payment target '${paymentTarget}'`);
    return {
      success: true,
      data: customers
    };
  } catch (error) {
    console.error(`Error getting customers by payment target '${paymentTarget}':`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Optimized query for expenses by date range
 */
export const getExpensesByDateRange = async (startDate: Timestamp, endDate: Timestamp): Promise<ApiResponse<Expense[]>> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.EXPENSES),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];

    console.log(`Retrieved ${expenses.length} expenses for date range`);
    return {
      success: true,
      data: expenses
    };
  } catch (error) {
    console.error(`Error getting expenses by date range:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Optimized query for active packages only
 */
export const getActivePackages = async (): Promise<ApiResponse<Package[]>> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PACKAGES),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const packages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Package[];

    console.log(`Retrieved ${packages.length} active packages`);
    return {
      success: true,
      data: packages
    };
  } catch (error) {
    console.error(`Error getting active packages:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// ==================== EXPORT ALL SERVICES ====================

export const services = {
  customer: customerService,
  package: packageService,
  expense: expenseService,
  payment: paymentService,
  report: reportService,
  settings: settingsService
};

// ==================== LEGACY EXPORTS (for backward compatibility) ====================

// Keep these for existing code that imports from specific files
export const addCustomer = customerService.create;
export const getCustomers = customerService.getAll;
export const getCustomerById = customerService.getById;
export const updateCustomer = customerService.update;
export const deleteCustomer = customerService.delete;
// getCustomersByStatus already exported from optimized function above

export const addPackage = packageService.create;
export const getPackages = packageService.getActive;
export const getAllPackages = packageService.getAll;
export const getPackageById = packageService.getById;
export const updatePackage = packageService.update;
export const deletePackage = packageService.delete;

export const addExpense = expenseService.create;
export const getExpenses = expenseService.getAll;
export const getExpenseById = expenseService.getById;
export const updateExpense = expenseService.update;
export const deleteExpense = expenseService.delete;
export const getExpensesByMonth = expenseService.getByMonth;
export const getExpensesByCategory = expenseService.getByCategory;