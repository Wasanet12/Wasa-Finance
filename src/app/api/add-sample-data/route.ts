import { NextResponse } from 'next/server';
import { services } from '@/lib/firestore';

export async function GET() {
  try {
    console.log('Adding sample data...');

    // Sample customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '08123456789',
        packageId: 'premium-pkg',
        packageName: 'Paket Premium',
        packagePrice: 500000,
        originalPrice: 500000,
        discountAmount: 0,
        status: 'active' as const,
        paymentTarget: 'Wasa' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phoneNumber: '08234567890',
        packageId: 'basic-pkg',
        packageName: 'Paket Basic',
        packagePrice: 300000,
        originalPrice: 300000,
        discountAmount: 0,
        status: 'pending' as const,
        paymentTarget: 'Kantor' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phoneNumber: '08345678901',
        packageId: 'premium-pkg',
        packageName: 'Paket Premium',
        packagePrice: 500000,
        originalPrice: 500000,
        discountAmount: 0,
        status: 'active' as const,
        paymentTarget: 'Wasa' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Sample expenses
    const sampleExpenses = [
      {
        description: 'Biaya Marketing',
        amount: 1500000,
        category: 'Marketing',
        date: new Date(2024, 9, 15), // October 15, 2024
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: 'Gaji Staff',
        amount: 3000000,
        category: 'Gaji',
        date: new Date(2024, 9, 20), // October 20, 2024
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: 'Sewa Kantor',
        amount: 2000000,
        category: 'Operasional',
        date: new Date(2024, 9, 25), // October 25, 2024
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add customers
    const customerIds = [];
    for (const customer of sampleCustomers) {
      const response = await services.customer.create(customer);
      if (response.success) {
        customerIds.push(response.data);
        console.log('Added customer:', response.data);
      } else {
        console.error('Failed to add customer:', response.error);
      }
    }

    // Add expenses
    const expenseIds = [];
    for (const expense of sampleExpenses) {
      const response = await services.expense.create(expense);
      if (response.success) {
        expenseIds.push(response.data);
        console.log('Added expense:', response.data);
      } else {
        console.error('Failed to add expense:', response.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${sampleCustomers.length} customers and ${sampleExpenses.length} expenses`,
      customerIds,
      expenseIds
    });
  } catch (error) {
    console.error('Error adding sample data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}