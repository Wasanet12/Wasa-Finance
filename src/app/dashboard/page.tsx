"use client";

import { useEffect, useState } from 'react';
import { useMonthYear } from '@/contexts/MonthYearContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { services } from '@/lib/firestore';
import { Customer, Expense } from '@/lib/types';
import { generatePDFReport } from '@/utils/pdfGenerator';
import { toDate } from '@/utils/dateUtils';
import { LayoutDashboard, DollarSign, Users, TrendingUp, TrendingDown, Building2, UserCheck, Download, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardMetrics {
  totalRevenue: number;
  totalRevenueBeforeDiscount: number;
  wasaProfit: number;
  wasaProfitBeforeDiscount: number;
  officeProfit: number;
  totalExpenses: number;
  wasaNetProfit: number;
  wasaNetProfitBeforeDiscount: number;
  totalDiscount: number;
  customersPayToWasa: number;
  customersPayToOffice: number;
  totalActiveCustomers: number;
  paidCustomers: number;
  unpaidCustomers: number;
  totalPaymentToWasa: number;
  totalPaymentToOffice: number;
}

interface ComparisonMetrics {
  revenueChange: number;
  revenueChangePercent: number;
  expensesChange: number;
  expensesChangePercent: number;
  customersChange: number;
  customersChangePercent: number;
  profitChange: number;
  profitChangePercent: number;
}

export default function DashboardPage() {
  // Use shared month/year context
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useMonthYear();

  // Add custom scrollbar styles - moved from top-level to useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);

      // Cleanup on unmount
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalRevenueBeforeDiscount: 0,
    wasaProfit: 0,
    wasaProfitBeforeDiscount: 0,
    officeProfit: 0,
    totalExpenses: 0,
    wasaNetProfit: 0,
    wasaNetProfitBeforeDiscount: 0,
    totalDiscount: 0,
    customersPayToWasa: 0,
    customersPayToOffice: 0,
    totalActiveCustomers: 0,
    paidCustomers: 0,
    unpaidCustomers: 0,
    totalPaymentToWasa: 0,
    totalPaymentToOffice: 0,
  });

  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics>({
    revenueChange: 0,
    revenueChangePercent: 0,
    expensesChange: 0,
    expensesChangePercent: 0,
    customersChange: 0,
    customersChangePercent: 0,
    profitChange: 0,
    profitChangePercent: 0,
  });

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper function to get month display name based on value
  const getMonthDisplayName = (monthValue: number) => {
    if (monthValue >= 1 && monthValue <= 12) {
      return months[monthValue - 1]; // months[0] = 'Januari', months[1] = 'Februari', etc.
    }
    return 'Pilih Bulan';
  };

  // Handle month change - REMOVED DANGEROUS AUTO-RESET FUNCTIONALITY
  const handleMonthChange = (newMonth: number) => {
    setSelectedMonth(newMonth);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateMetrics();
  }, [customers, expenses, selectedMonth, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateComparisonMetrics = (currentMetrics: DashboardMetrics) => {
    // Calculate comparison metrics for the selected month

    // Calculate previous month and year
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = selectedYear - 1;
    }

    // Filter data for previous month
    const prevMonthCustomers = customers.filter(customer => {
      if (!customer.createdAt) return false;
      const customerDate = toDate(customer.createdAt);
      if (!customerDate) return false;
      return customerDate.getMonth() === (prevMonth - 1) && customerDate.getFullYear() === prevYear;
    });

    const prevMonthExpenses = expenses.filter(expense => {
      const expenseDate = toDate(expense.date);
      if (!expenseDate) return false;
      return expenseDate.getMonth() === (prevMonth - 1) && expenseDate.getFullYear() === prevYear;
    });

    // Calculate previous month metrics
    const prevRevenue = prevMonthCustomers.reduce((sum, customer) => {
      const finalPrice = customer.packagePrice - (customer.discountAmount || 0);
      return sum + finalPrice;
    }, 0);

    const prevExpenses = prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const prevCustomers = prevMonthCustomers.filter(customer =>
      customer.status === 'active'
    ).length;

    const prevProfit = prevRevenue - prevExpenses;

    // Calculate changes
    const revenueChange = currentMetrics.totalRevenue - prevRevenue;
    const revenueChangePercent = prevRevenue > 0 ? (revenueChange / prevRevenue) * 100 : 0;

    const expensesChange = currentMetrics.totalExpenses - prevExpenses;
    const expensesChangePercent = prevExpenses > 0 ? (expensesChange / prevExpenses) * 100 : 0;

    const customersChange = currentMetrics.totalActiveCustomers - prevCustomers;
    const customersChangePercent = prevCustomers > 0 ? (customersChange / prevCustomers) * 100 : 0;

    const profitChange = currentMetrics.wasaNetProfit - prevProfit;
    const profitChangePercent = prevProfit > 0 ? (profitChange / prevProfit) * 100 : 0;

    setComparisonMetrics({
      revenueChange,
      revenueChangePercent,
      expensesChange,
      expensesChangePercent,
      customersChange,
      customersChangePercent,
      profitChange,
      profitChangePercent,
    });
  };

  const fetchData = async () => {
    try {
      console.log('Fetching data from Firebase...');
      const [customersResponse, expensesResponse] = await Promise.all([
        services.customer.getAll(),
        services.expense.getAll()
      ]);

      if (customersResponse.success && customersResponse.data) {
        console.log('Customers fetched:', customersResponse.data.length, customersResponse.data);
        setCustomers(customersResponse.data);
      } else {
        console.error('Error fetching customers:', customersResponse.error);
        setCustomers([]);
      }

      if (expensesResponse.success && expensesResponse.data) {
        console.log('Expenses fetched:', expensesResponse.data.length, expensesResponse.data);
        setExpenses(expensesResponse.data);
      } else {
        console.error('Error fetching expenses:', expensesResponse.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty data on error to prevent undefined errors
      setCustomers([]);
      setExpenses([]);
    }
  };

  const getFilteredData = () => {
    // Filter customers for selected month and year
    const filteredCustomers = customers.filter(customer => {
      if (!customer.createdAt) return false;

      const customerDate = toDate(customer.createdAt);
      if (!customerDate) return false;
      const matches = customerDate.getMonth() === (selectedMonth - 1) &&
             customerDate.getFullYear() === selectedYear;
      return matches;
    });

    // Filter expenses for selected month and year
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = toDate(expense.date);
      if (!expenseDate) return false;
      const matches = expenseDate.getMonth() === (selectedMonth - 1) &&
             expenseDate.getFullYear() === selectedYear;
      return matches;
    });

    return { filteredCustomers, filteredExpenses };
  };

  const calculateMetrics = () => {
    console.log('Calculating metrics...');
    console.log('Current customers count:', customers.length);
    console.log('Current expenses count:', expenses.length);
    console.log('Selected month:', selectedMonth, 'Selected year:', selectedYear);

    // Get filtered data
    const { filteredCustomers, filteredExpenses } = getFilteredData();

    // If no data, return zeros
    if (!customers.length && !expenses.length) {
      console.log('No data available, setting all metrics to zero');
      setMetrics({
        totalRevenue: 0,
        totalRevenueBeforeDiscount: 0,
        wasaProfit: 0,
        wasaProfitBeforeDiscount: 0,
        officeProfit: 0,
        totalExpenses: 0,
        wasaNetProfit: 0,
        wasaNetProfitBeforeDiscount: 0,
        totalDiscount: 0,
        customersPayToWasa: 0,
        customersPayToOffice: 0,
        totalActiveCustomers: 0,
        paidCustomers: 0,
        unpaidCustomers: 0,
        totalPaymentToWasa: 0,
        totalPaymentToOffice: 0,
      });
      return;
    }

    console.log('Filtered customers count:', filteredCustomers.length);
    console.log('Filtered expenses count:', filteredExpenses.length);

    // NEW LOGIC: Based on correct business understanding
    // 1. Total gross revenue = all active customers' package prices (no discount)
    const totalRevenueBeforeDiscount = filteredCustomers
      .filter(customer => customer.status === 'active')
      .reduce((sum, customer) => sum + customer.packagePrice, 0);

    // 2. Separate customers by payment target
    const customersPayToWasa = filteredCustomers.filter(
      customer => customer.status === 'active' && (customer.paymentTarget === 'Wasa' || !customer.paymentTarget)
    );

    const customersPayToOffice = filteredCustomers.filter(
      customer => customer.status === 'active' && customer.paymentTarget === 'Kantor'
    );

    // 3. Calculate revenue from each payment target (using package prices, no discount)
    const wasaRevenue = customersPayToWasa
      .reduce((sum, customer) => sum + customer.packagePrice, 0);

    const officeRevenue = customersPayToOffice
      .reduce((sum, customer) => sum + customer.packagePrice, 0);

    // 4. Calculate profit splits (based on package prices, not after discount)
    const wasaProfit = (wasaRevenue * 0.4) + (officeRevenue * 0.4); // Wasa gets 40% from all customers
    const officeProfit = (wasaRevenue * 0.6) + (officeRevenue * 0.6); // Office gets 60% from all customers

    // For compatibility with interface - profit before discount (same as profit in new logic)
    const wasaProfitBeforeDiscount = wasaProfit; // In new logic, profit is always calculated from package prices

    // 5. Calculate total discount (only from Wasa customers, since they bear the discount cost)
    const wasaTotalDiscount = customersPayToWasa
      .reduce((sum, customer) => sum + (customer.discountAmount || 0), 0);

    const totalDiscount = filteredCustomers
      .filter(customer => customer.status === 'active')
      .reduce((sum, customer) => sum + (customer.discountAmount || 0), 0);

    // 6. Calculate total expenses
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // 7. Calculate net profit (wasa profit minus expenses minus discount cost)
    // Important: Discount reduces wasa's net profit, not office profit
    const wasaNetProfitBeforeDiscount = wasaProfit - totalExpenses;
    const wasaNetProfitAfterDiscount = wasaNetProfitBeforeDiscount - wasaTotalDiscount;

    // Debug: Log semua nilai penting
    console.log('=== DEBUG DASHBOARD CALCULATIONS ===');
    console.log('Filtered customers:', filteredCustomers.length);
    console.log('Customers Pay to Wasa:', customersPayToWasa.length);
    console.log('Customers Pay to Office:', customersPayToOffice.length);
    console.log('Wasa Revenue:', wasaRevenue);
    console.log('Office Revenue:', officeRevenue);
    console.log('Wasa Profit:', wasaProfit);
    console.log('Total Expenses:', totalExpenses);
    console.log('Wasa Total Discount (only from Wasa customers):', wasaTotalDiscount);
    console.log('Total Discount (all customers):', totalDiscount);
    console.log('Wasa Net Profit Before Discount:', wasaNetProfitBeforeDiscount);
    console.log('Wasa Net Profit After Discount:', wasaNetProfitAfterDiscount);
    console.log('Expected net profit difference:', wasaTotalDiscount);
    console.log('Actual net profit difference:', wasaNetProfitBeforeDiscount - wasaNetProfitAfterDiscount);
    console.log('=== END DEBUG ===');

    // 8. Calculate revenue after discount
    // Office revenue unchanged, Wasa revenue reduced by discount

    // Count customers by payment target (handle missing paymentTarget field)
    const customersPayToWasaCount = filteredCustomers.filter(
      customer => customer.status === 'active' && (customer.paymentTarget === 'Wasa' || !customer.paymentTarget)
    ).length;

    const customersPayToOfficeCount = filteredCustomers.filter(
      customer => customer.status === 'active' && customer.paymentTarget === 'Kantor'
    ).length;

    // Calculate total payment amounts to Wasa and Office
    // Use packagePrice to match the logic from the paid customers page
    const totalPaymentToWasa = filteredCustomers
      .filter(customer => customer.status === 'active' && (customer.paymentTarget === 'Wasa' || !customer.paymentTarget))
      .reduce((sum, customer) => sum + customer.packagePrice, 0);

    const totalPaymentToOffice = filteredCustomers
      .filter(customer => customer.status === 'active' && customer.paymentTarget === 'Kantor')
      .reduce((sum, customer) => sum + customer.packagePrice, 0);

    // Debug payment target counts
    console.log('=== Payment Target Debug ===');
    console.log('Total filtered customers:', filteredCustomers.length);
    console.log('Filtered customers:', filteredCustomers.map(c => ({
      name: c.name,
      status: c.status,
      paymentTarget: c.paymentTarget
    })));
    console.log('Active + Wasa customers:', filteredCustomers.filter(c => c.status === 'active' && c.paymentTarget === 'Wasa').length);
    console.log('Active + Kantor customers:', filteredCustomers.filter(c => c.status === 'active' && c.paymentTarget === 'Kantor').length);
    console.log('All payment targets:', filteredCustomers.map(c => c.paymentTarget));
    console.log('All statuses:', filteredCustomers.map(c => c.status));

    // Count all active customers (not 'inactive')
    const totalActiveCustomers = customers.filter(customer => customer.status !== 'inactive').length;

    // Count paid and unpaid customers
    const paidCustomers = customers.filter(customer => customer.status === 'active').length;
    const unpaidCustomers = customers.filter(customer => customer.status === 'inactive').length;

    const finalMetrics = {
      totalRevenue: totalRevenueBeforeDiscount, // Use gross revenue for display
      totalRevenueBeforeDiscount,
      wasaProfit,
      wasaProfitBeforeDiscount,
      officeProfit,
      totalExpenses,
      wasaNetProfit: wasaNetProfitAfterDiscount, // Use after-discount net profit
      wasaNetProfitBeforeDiscount,
      totalDiscount,
      customersPayToWasa: customersPayToWasaCount,
      customersPayToOffice: customersPayToOfficeCount,
      totalActiveCustomers,
      paidCustomers,
      unpaidCustomers,
      totalPaymentToWasa,
      totalPaymentToOffice,
    };

    console.log('Final metrics calculated:', finalMetrics);
    setMetrics(finalMetrics);

    // Calculate comparison metrics after current metrics are set
    calculateComparisonMetrics(finalMetrics);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeIndicator = (value: number, percent: number) => {
    if (value === 0) {
      return (
        <div className="flex items-center justify-end" style={{ width: '100%', fontSize: '14px' }}>
          <Minus className="h-4 w-4" style={{ color: '#FFFFFF', marginRight: '4px' }} />
          <span style={{ color: '#FFFFFF' }}>0%</span>
        </div>
      );
    }

    const isPositive = value > 0;
    const color = '#FFFFFF';
    const icon = isPositive ?
      <ArrowUpRight className="h-4 w-4" style={{ color, marginRight: '4px' }} /> :
      <ArrowDownRight className="h-4 w-4" style={{ color, marginRight: '4px' }} />;

    return (
      <div className="flex items-center justify-end" style={{ width: '100%', fontSize: '14px' }}>
        {icon}
        <span style={{ color, fontWeight: '500' }}>
          {Math.abs(percent).toFixed(1)}%
        </span>
      </div>
    );
  };

  const getTopCustomers = () => {
    const { filteredCustomers } = getFilteredData();
    return filteredCustomers
      .filter(customer => customer.status === 'active' || customer.status === 'Sudah Bayar')
      .sort((a, b) => (b.packagePrice - (b.discountAmount || 0)) - (a.packagePrice - (a.discountAmount || 0)))
      .slice(0, 5);
  };

  const getTopExpenses = () => {
    const { filteredExpenses } = getFilteredData();
    return filteredExpenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const handleDownloadPDF = () => {
    // Get filtered data
    const { filteredCustomers, filteredExpenses } = getFilteredData();

    // Prepare data for PDF
    const pdfData = {
      customers: filteredCustomers,
      expenses: filteredExpenses,
      selectedMonth,
      selectedYear,
      ...metrics,
    };

    try {
      generatePDFReport(pdfData);
      console.log('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row md:items-center md:justify-between gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#3B82F620' }}>
            <LayoutDashboard className="h-5 w-5 sm:h-5 sm:w-5" style={{ color: '#1B2336' }} />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 transition-all duration-300" style={{ color: '#1B2336' }}>
            Dashboard
          </h1>
        </div>

        {/* Filter Controls - Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Download Button - Responsive */}
          <Button
            onClick={handleDownloadPDF}
            style={{
              backgroundColor: '#1B2336',
              color: '#FFFFFF',
              borderColor: '#3D4558',
              minHeight: '44px', // Touch-friendly size
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base w-full sm:w-auto hover:bg-opacity-90 transition-colors"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">Unduh</span>
          </Button>

          {/* Month Selector - Responsive */}
          <Select value={selectedMonth.toString()} onValueChange={(value) => handleMonthChange(parseInt(value))}>
            <SelectTrigger
              className="w-full sm:w-40 min-h-[44px]"
              style={{
                backgroundColor: '#1B2336',
                color: '#FFFFFF',
                borderColor: '#3D4558',
                fontSize: '14px'
              }}
            >
                          <SelectValue placeholder={getMonthDisplayName(selectedMonth)} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: '#1B2336', borderColor: '#3D4558' }}>
              {months.map((month, index) => (
                <SelectItem
                  key={month}
                  value={(index + 1).toString()}
                  style={{ color: '#FFFFFF', fontSize: '14px' }}
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector - Modern Design */}
          <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 min-h-[44px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(Math.max(2020, selectedYear - 1))}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-l-lg"
              disabled={selectedYear <= 2020}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 text-center">
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setSelectedYear(new Date().getFullYear());
                  } else {
                    const parsedValue = parseInt(value);
                    setSelectedYear(isNaN(parsedValue) ? new Date().getFullYear() : Math.max(2020, Math.min(2030, parsedValue)));
                  }
                }}
                className="w-full text-center bg-transparent border-0 text-white font-medium focus:outline-none focus:ring-0"
                style={{
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
                min="2020"
                max="2030"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(Math.min(2030, selectedYear + 1))}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-r-lg"
              disabled={selectedYear >= 2030}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Metrics - Responsive */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Total Pendapatan Kotor
              </CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold truncate leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {formatCurrency(metrics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Laba Wasa (40%)
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold truncate leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {formatCurrency(metrics.wasaProfit)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Laba Kantor (60%)
              </CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold truncate leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {formatCurrency(metrics.officeProfit)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Total Biaya Operasional
              </CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold truncate leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {formatCurrency(metrics.totalExpenses)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Net Profit and Payment Metrics - Responsive */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Keuntungan Bersih Wasa
              </CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              {(metrics.totalDiscount > 0 || metrics.wasaNetProfitBeforeDiscount !== metrics.wasaNetProfit) ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        Sebelum diskon:
                      </span>
                      <span className="text-xs truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(metrics.wasaNetProfitBeforeDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        Sesudah diskon:
                      </span>
                      <span className="text-xs truncate font-medium transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(metrics.wasaNetProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        Diskon Wasa:
                      </span>
                      <span className="text-xs truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(metrics.wasaNetProfitBeforeDiscount - metrics.wasaNetProfit)}
                      </span>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold truncate mt-2 leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                    {formatCurrency(metrics.wasaNetProfit)}
                  </div>
                </>
              ) : (
                <div className="text-base sm:text-lg md:text-xl font-bold truncate leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(metrics.wasaNetProfit)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Pelanggan Bayar ke Wasa
              </CardTitle>
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {metrics.customersPayToWasa}
              </div>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Total: {formatCurrency(metrics.totalPaymentToWasa)}
              </p>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                ⚠️ Kantor (60%): {formatCurrency(metrics.totalPaymentToWasa * 0.6)}
              </p>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                ✅ Wasa (40%): {formatCurrency(metrics.totalPaymentToWasa * 0.4)}
              </p>
                    </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Pelanggan Bayar ke Kantor
              </CardTitle>
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {metrics.customersPayToOffice}
              </div>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Total: {formatCurrency(metrics.totalPaymentToOffice)}
              </p>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                💵 Wasa (40%): {formatCurrency(metrics.totalPaymentToOffice * 0.4)}
              </p>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                ✅ Kantor (60%): {formatCurrency(metrics.totalPaymentToOffice * 0.6)}
              </p>
                          </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                Total Pelanggan Aktif
              </CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-all duration-300" style={{ color: '#FFFFFF' }} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-base sm:text-lg md:text-xl font-bold leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {metrics.totalActiveCustomers}
              </div>
              <p className="text-xs mt-1 leading-snug truncate transition-all duration-300" style={{ color: '#FFFFFF' }}>
                {metrics.unpaidCustomers > 0 && (
                  <span className="text-white">
                    ⚠️ {metrics.unpaidCustomers} non-aktif
                  </span>
                )}
                {metrics.unpaidCustomers === 0 && (
                  <span className="text-white">
                    ✅ Semua pelanggan aktif
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistical Tables */}
      <div className="px-2 sm:px-4 space-y-3 sm:space-y-6">
        {/* Comparison Metrics Table */}
        {selectedMonth !== 0 && (
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center space-x-2 sm:space-x-3" style={{ color: '#FFFFFF' }}>
                <div className="p-2 rounded-lg transition-all duration-300" style={{ backgroundColor: '#10B98120' }}>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300" style={{ color: '#FFFFFF' }} />
                </div>
                <span className="text-sm sm:text-base font-semibold transition-all duration-300">Perbandingan dengan Bulan Lalu</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: '#0F1725', borderColor: '#1E293B' }}>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[640px]">
                    <UITable>
                <TableHeader>
                    <TableRow style={{ backgroundColor: '#1E293B' }}>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Metrik</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-snug transition-all duration-300" style={{ color: '#FFFFFF' }}>Bulan Ini</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-snug transition-all duration-300" style={{ color: '#FFFFFF' }}>Perubahan</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-snug transition-all duration-300" style={{ color: '#FFFFFF' }}>Persentase</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2 px-2 sm:py-3 sm:px-3 font-medium text-xs sm:text-sm transition-all duration-300" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-2 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: '#10B981' }}></div>
                        <span className="truncate">Total Pendapatan</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right font-semibold text-xs sm:text-sm transition-all duration-300" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.totalRevenue)}
                    </TableCell>
                    <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right text-xs sm:text-sm transition-all duration-300" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(comparisonMetrics.revenueChange)}
                    </TableCell>
                    <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right">
                      {getChangeIndicator(comparisonMetrics.revenueChange, comparisonMetrics.revenueChangePercent)}
                    </TableCell>
                  </TableRow>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                        <span>Total Biaya</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.totalExpenses)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      {formatCurrency(comparisonMetrics.expensesChange)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right">
                      {getChangeIndicator(comparisonMetrics.expensesChange, comparisonMetrics.expensesChangePercent)}
                    </TableCell>
                  </TableRow>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                        <span>Laba Wasa Kotor</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.wasaProfit)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      -
                    </TableCell>
                    <TableCell className="py-3 px-3 sm:py-4 sm:px-5 text-right" style={{ fontSize: '14px' }}>
                      <div className="flex items-center justify-end" style={{ width: '100%' }}>
                        <Minus className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6B7280' }}></div>
                        <span>Laba Wasa Net (Sebelum Diskon)</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.wasaNetProfitBeforeDiscount)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      -
                    </TableCell>
                    <TableCell className="py-3 px-3 sm:py-4 sm:px-5 text-right" style={{ fontSize: '14px' }}>
                      <div className="flex items-center justify-end" style={{ width: '100%' }}>
                        <Minus className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                        <span>Beban Diskon Wasa</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.wasaNetProfitBeforeDiscount - metrics.wasaNetProfit)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      -
                    </TableCell>
                    <TableCell className="py-3 px-3 sm:py-4 sm:px-5 text-right" style={{ fontSize: '14px' }}>
                      <div className="flex items-center justify-end" style={{ width: '100%' }}>
                        <Minus className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                <TableRow className="border-b" style={{ borderColor: '#1E293B' }}>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
                        <span>Laba Wasa Net (Setelah Diskon)</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-2 sm:py-4 sm:px-5 text-right font-bold text-lg sm:text-lg" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(metrics.wasaNetProfit)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      {formatCurrency(comparisonMetrics.profitChange)}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right">
                      {getChangeIndicator(comparisonMetrics.profitChange, comparisonMetrics.profitChangePercent)}
                    </TableCell>
                  </TableRow>
                <TableRow>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 font-medium" style={{ color: '#FFFFFF' }}>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#06B6D4' }}></div>
                        <span>Pelanggan Aktif</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right font-semibold" style={{ color: '#FFFFFF' }}>
                      {metrics.totalActiveCustomers}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                      {comparisonMetrics.customersChange > 0 ? '+' : ''}{comparisonMetrics.customersChange}
                    </TableCell>
                    <TableCell className="py-2.5 px-2 sm:py-4 sm:px-5 text-right">
                      {getChangeIndicator(comparisonMetrics.customersChange, comparisonMetrics.customersChangePercent)}
                    </TableCell>
                  </TableRow>
              </TableBody>
            </UITable>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Customers Table */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-4 sm:pt-5">
              <CardTitle className="flex items-center space-x-2 sm:space-x-3" style={{ color: '#FFFFFF' }}>
                <div className="p-2 rounded-lg transition-all duration-300" style={{ backgroundColor: '#3B82F620' }}>
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300" style={{ color: '#FFFFFF' }} />
                </div>
                <span className="text-sm sm:text-base font-semibold transition-all duration-300">5 Pelanggan Teratas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5">
              <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: '#0F1725', borderColor: '#1E293B' }}>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[400px] sm:min-w-[500px]">
                    <UITable>
                <TableHeader>
                    <TableRow style={{ backgroundColor: '#1E293B' }}>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Nama</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Paket</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {getTopCustomers().length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 sm:py-8" style={{ color: '#FFFFFF' }}>
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto transition-all duration-300" style={{ color: '#FFFFFF' }} />
                          <span className="text-sm transition-all duration-300">Belum ada data pelanggan</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getTopCustomers().map((customer, index) => (
                      <TableRow key={customer.id} className="border-b last:border-b-0 hover:bg-white/5 transition-colors transition-all duration-300" style={{ borderColor: '#1E293B' }}>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold transition-all duration-300"
                                 style={{
                                   backgroundColor: index === 0 ? '#FCD34D' : index === 1 ? '#A5B4FC' : '#94A3B8',
                                   color: '#FFFFFF'
                                 }}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-xs sm:text-sm text-white truncate transition-all duration-300">{customer.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right">
                          <div className="text-right">
                            <div className="font-medium text-xs sm:text-sm transition-all duration-300" style={{ color: '#FFFFFF' }}>
                              {customer.packageName || `Paket ${formatCurrency(customer.packagePrice)}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right">
                          <div className="text-right">
                            <div className="font-semibold text-sm sm:text-base transition-all duration-300" style={{ color: '#FFFFFF' }}>
                              {formatCurrency(customer.packagePrice - (customer.discountAmount || 0))}
                            </div>
                            {(customer.discountAmount || 0) > 0 && (
                              <div className="text-xs text-orange-400 font-medium transition-all duration-300">
                                Diskon: {formatCurrency(customer.discountAmount || 0)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </UITable>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Expenses Table */}
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1B2336' }}>
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-4 sm:pt-5">
              <CardTitle className="flex items-center space-x-2 sm:space-x-3" style={{ color: '#FFFFFF' }}>
                <div className="p-2 rounded-lg transition-all duration-300" style={{ backgroundColor: '#EF444420' }}>
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300" style={{ color: '#FFFFFF' }} />
                </div>
                <span className="text-sm sm:text-base font-semibold transition-all duration-300">5 Pengeluaran Teratas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5">
              <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: '#0F1725', borderColor: '#1E293B' }}>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[400px] sm:min-w-[500px]">
                    <UITable>
                <TableHeader>
                    <TableRow style={{ backgroundColor: '#1E293B' }}>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Deskripsi</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Kategori</TableHead>
                      <TableHead className="py-2 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-right leading-tight transition-all duration-300" style={{ color: '#FFFFFF' }}>Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {getTopExpenses().length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 sm:py-8" style={{ color: '#FFFFFF' }}>
                        <div className="flex flex-col items-center space-y-2">
                          <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 mx-auto transition-all duration-300" style={{ color: '#FFFFFF' }} />
                          <span className="text-sm transition-all duration-300">Belum ada data pengeluaran</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getTopExpenses().map((expense, index) => (
                      <TableRow key={expense.id} className="border-b last:border-b-0 hover:bg-white/5 transition-colors transition-all duration-300" style={{ borderColor: '#1E293B' }}>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold transition-all duration-300"
                                 style={{
                                   backgroundColor: index === 0 ? '#F87171' : index === 1 ? '#FB923C' : '#94A3B8',
                                   color: '#FFFFFF'
                                 }}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-xs sm:text-sm text-white truncate transition-all duration-300">{expense.description}</div>
                              <div className="text-xs mt-0.5 transition-all duration-300" style={{ color: '#FFFFFF' }}>
                                {(toDate(expense?.date || new Date()) || new Date()).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right">
                          <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium transition-all duration-300"
                                style={{
                                  backgroundColor: '#2D3548',
                                  color: '#FFFFFF'
                                }}>
                            {expense.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-3 text-right">
                          <div className="text-right">
                            <div className="font-semibold text-sm sm:text-base transition-all duration-300" style={{ color: '#FFFFFF' }}>
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="text-xs transition-all duration-300" style={{ color: '#FFFFFF' }}>
                              {(toDate(expense?.date || new Date()) || new Date()).toLocaleDateString('id-ID', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </UITable>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}