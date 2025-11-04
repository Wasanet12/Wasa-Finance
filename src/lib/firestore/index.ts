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
   * Get customers by status
   */
  getByStatus: async (status: Customer['status']): Promise<ApiResponse<Customer[]>> => {
    try {
      // Get all customers ordered by creation date, then filter by status
      const allCustomers = await getAllDocuments<Customer>(COLLECTIONS.CUSTOMERS, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      if (allCustomers.success && allCustomers.data) {
        // Filter by status on client side
        const filteredCustomers = allCustomers.data.filter(customer => customer.status === status);
        console.log(`Found ${filteredCustomers.length} customers with status '${status}'`);
        return {
          success: true,
          data: filteredCustomers
        };
      }

      return allCustomers;
    } catch (error: any) {
      console.error('Error fetching customers by status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers by status'
      };
    }
  },

  /**
   * Get customers by payment target
   */
  getByPaymentTarget: async (paymentTarget: Customer['paymentTarget']): Promise<ApiResponse<Customer[]>> => {
    try {
      // Get all customers ordered by creation date, then filter by payment target
      const allCustomers = await getAllDocuments<Customer>(COLLECTIONS.CUSTOMERS, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      if (allCustomers.success && allCustomers.data) {
        // Filter by payment target on client side
        const filteredCustomers = allCustomers.data.filter(customer => customer.paymentTarget === paymentTarget);
        console.log(`Found ${filteredCustomers.length} customers with payment target '${paymentTarget}'`);
        return {
          success: true,
          data: filteredCustomers
        };
      }

      return allCustomers;
    } catch (error: any) {
      console.error('Error fetching customers by payment target:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers by payment target'
      };
    }
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
    try {
      // Use simpler query to avoid index issues - get all packages ordered by creation date
      const allPackages = await getAllDocuments<Package>(COLLECTIONS.PACKAGES, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      if (allPackages.success && allPackages.data) {
        // Filter and sort on client side
        const activePackages = allPackages.data
          .filter(pkg => pkg.isActive === true)
          .sort((a, b) => a.price - b.price); // Sort by price ascending

        console.log(`Found ${activePackages.length} active packages`);
        return {
          success: true,
          data: activePackages
        };
      }

      return allPackages;
    } catch (error: any) {
      console.error('Error fetching active packages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch packages'
      };
    }
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
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

      // Get all expenses ordered by date, then filter by date range
      const allExpenses = await getAllDocuments<Expense>(COLLECTIONS.EXPENSES, {
        orderBy: { field: 'date', direction: 'desc' }
      });

      if (allExpenses.success && allExpenses.data) {
        // Filter by date range on client side
        const filteredExpenses = allExpenses.data.filter(expense => {
          const expenseDate = expense.date;
          return expenseDate >= startDate && expenseDate <= endDate;
        });
        console.log(`Found ${filteredExpenses.length} expenses for ${month}/${year}`);
        return {
          success: true,
          data: filteredExpenses
        };
      }

      return allExpenses;
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
export const getCustomersByStatus = customerService.getByStatus;

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