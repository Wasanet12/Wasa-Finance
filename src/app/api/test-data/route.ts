import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase connection...');

    // Test get customers
    const customerResponse = await services.customer.getAll();
    const customers = customerResponse.success ? customerResponse.data || [] : [];
    console.log('Customers from Firebase:', customers);

    // Test get expenses
    const expenseResponse = await services.expense.getAll();
    const expenses = expenseResponse.success ? expenseResponse.data || [] : [];
    console.log('Expenses from Firebase:', expenses);

    return NextResponse.json({
      success: true,
      customersCount: customers.length,
      expensesCount: expenses.length,
      customers: customers.slice(0, 3), // Show first 3 for preview
      expenses: expenses.slice(0, 3),   // Show first 3 for preview
      message: `Found ${customers.length} customers and ${expenses.length} expenses`
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}