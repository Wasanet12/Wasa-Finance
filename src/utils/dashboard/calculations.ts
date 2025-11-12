/**
 * Dashboard Calculation Utilities
 * Centralized business logic for metrics and calculations
 */

import { Customer, Expense } from '@/lib/types';
import { PROFIT_SHARE } from '@/constants';

export interface DashboardMetrics {
  totalRevenue: number;
  wasaRevenue: number;
  officeRevenue: number;
  totalExpenses: number;
  wasaNetProfit: number;
  totalActiveCustomers: number;
  paidCustomers: number;
  unpaidCustomers: number;
  customersPayToWasa: number;
  customersPayToOffice: number;
  totalPaymentToWasa: number;
  totalPaymentToOffice: number;
  wasaProfit: number;
  officeProfit: number;
  wasaNetProfitBeforeDiscount: number;
}

export interface PaymentMetrics {
  wasaCustomers: Customer[];
  officeCustomers: Customer[];
  wasaPaymentAmount: number;
  officePaymentAmount: number;
  totalToWasa: number;
  totalToOffice: number;
}

/**
 * Calculate revenue metrics from customers
 */
export const calculateRevenueMetrics = (customers: Customer[]) => {
  const wasaCustomers = customers.filter(c => c.paymentTarget === 'Wasa');
  const officeCustomers = customers.filter(c => c.paymentTarget === 'Kantor');

  const wasaRevenue = wasaCustomers.reduce((sum, customer) => {
    const finalPrice = customer.packagePrice - (customer.discountAmount || 0);
    return sum + finalPrice;
  }, 0);

  const officeRevenue = officeCustomers.reduce((sum, customer) => {
    const finalPrice = customer.packagePrice - (customer.discountAmount || 0);
    return sum + finalPrice;
  }, 0);

  const totalRevenue = wasaRevenue + officeRevenue;

  return { totalRevenue, wasaRevenue, officeRevenue };
};

/**
 * Calculate profit distribution based on payment targets
 */
export const calculateProfitDistribution = (wasaRevenue: number, officeRevenue: number) => {
  // Wasa gets 40% from both revenue streams
  const wasaProfit = (wasaRevenue * PROFIT_SHARE.WASA) + (officeRevenue * PROFIT_SHARE.WASA);

  // Office gets 60% from both revenue streams
  const officeProfit = (wasaRevenue * PROFIT_SHARE.OFFICE) + (officeRevenue * PROFIT_SHARE.OFFICE);

  return { wasaProfit, officeProfit };
};

/**
 * Calculate customer metrics
 */
export const calculateCustomerMetrics = (customers: Customer[]) => {
  const activeCustomers = customers.filter(customer =>
    customer.status === 'active'
  );

  const paidCustomers = customers.filter(customer =>
    customer.status === 'active'
  );

  const unpaidCustomers = customers.filter(customer =>
    customer.status === 'active'
  );

  const wasaCustomers = customers.filter(c => c.paymentTarget === 'Wasa');
  const officeCustomers = customers.filter(c => c.paymentTarget === 'Kantor');

  return {
    totalActiveCustomers: activeCustomers.length,
    paidCustomers: paidCustomers.length,
    unpaidCustomers: unpaidCustomers.length,
    customersPayToWasa: wasaCustomers.length,
    customersPayToOffice: officeCustomers.length,
  };
};

/**
 * Calculate payment distribution metrics
 */
export const calculatePaymentDistribution = (customers: Customer[]): PaymentMetrics => {
  const wasaCustomers = customers.filter(c => c.paymentTarget === 'Wasa');
  const officeCustomers = customers.filter(c => c.paymentTarget === 'Kantor');

  const wasaPaymentAmount = wasaCustomers.reduce((sum, customer) => {
    const finalPrice = customer.packagePrice - (customer.discountAmount || 0);
    return sum + finalPrice;
  }, 0);

  const officePaymentAmount = officeCustomers.reduce((sum, customer) => {
    const finalPrice = customer.packagePrice - (customer.discountAmount || 0);
    return sum + finalPrice;
  }, 0);

  // Calculate payments that need to be made
  const totalToWasa = wasaPaymentAmount + (officePaymentAmount * PROFIT_SHARE.WASA);
  const totalToOffice = officePaymentAmount + (wasaPaymentAmount * PROFIT_SHARE.OFFICE);

  return {
    wasaCustomers,
    officeCustomers,
    wasaPaymentAmount,
    officePaymentAmount,
    totalToWasa,
    totalToOffice,
  };
};

/**
 * Calculate expense metrics
 */
export const calculateExpenseMetrics = (expenses: Expense[]) => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Get previous month dates
 */
export const getPreviousMonth = (currentMonth: number, currentYear: number) => {
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = currentYear - 1;
  }

  return { prevMonth, prevYear };
};

/**
 * Filter customers by date range
 */
export const filterCustomersByDate = (
  customers: Customer[],
  month: number,
  year: number
) => {
  return customers.filter(customer => {
    if (!customer.createdAt) return false;
    const customerDate = new Date(customer.createdAt);
    return customerDate.getMonth() === (month - 1) && customerDate.getFullYear() === year;
  });
};

/**
 * Filter expenses by date range
 */
export const filterExpensesByDate = (
  expenses: Expense[],
  month: number,
  year: number
) => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === (month - 1) && expenseDate.getFullYear() === year;
  });
};