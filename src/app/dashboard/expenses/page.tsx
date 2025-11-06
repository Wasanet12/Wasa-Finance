"use client";

import { useEffect, useState } from 'react';
import { useMonthYear } from '@/contexts/MonthYearContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExpenseForm } from '@/components/wasa/expense-form';
import { services } from '@/lib/firestore';
import { Expense } from '@/lib/types';
import { generateExpensePDFReport } from '@/utils/pdfGenerator';
import { formatDate, toDate, formatCurrency } from '@/utils/dateUtils';
import { Edit, Trash2, DollarSign, TrendingDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExpensesPage() {
  const { selectedMonth, selectedYear } = useMonthYear();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Responsive pagination - set items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  const fetchExpenses = async () => {
    try {
      const response = await services.expense.getAll();
      if (response.success && response.data) {
        // Sort expenses by date descending (newest first)
        const sortedExpenses = response.data.sort((a, b) => {
          const dateA = toDate(a.date);
          const dateB = toDate(b.date);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        setExpenses(sortedExpenses);
      } else {
        console.error('Failed to fetch expenses:', response.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await services.expense.delete(expenseId);
      if (response.success) {
        fetchExpenses();
      } else {
        console.error('Failed to delete expense:', response.error);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Filter expenses untuk bulan dan tahun yang dipilih
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = toDate(expense.date);
    if (!expenseDate) return false;
    return expenseDate.getMonth() === (selectedMonth - 1) &&
           expenseDate.getFullYear() === selectedYear;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Reset to page 1 when selected month/year changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear]);

  const selectedMonthExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleDownloadPDF = () => {
    try {
      const monthYearText = selectedMonth !== 0
        ? `-${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
        : '';
      generateExpensePDFReport(filteredExpenses, `Laporan-Biaya${monthYearText}.pdf`);
    } catch (error) {
      // Handle PDF generation error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#1B2336' }} />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#1B2336' }}>
            Biaya Operasional
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDownloadPDF}
            className="custom-btn flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base w-full sm:w-auto"
            style={{
              minHeight: '44px', // Touch-friendly size
            }}
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">Unduh PDF</span>
          </Button>
          <ExpenseForm onSuccess={fetchExpenses} />
        </div>
      </div>

      {/* Expense Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Biaya Operasional
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Semua waktu
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Biaya Bulan Dipilih
            </CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(selectedMonthExpenses)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              {selectedMonth !== 0 ?
                new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) :
                'Pilih bulan'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ color: '#FFFFFF' }}>
            <span className="text-lg sm:text-xl">Daftar Biaya Operasional</span>
            <div className="text-sm font-normal" style={{ color: '#FFFFFF' }}>
              Total: {filteredExpenses.length} biaya
              {selectedMonth !== 0 && ` - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          
          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
                {selectedMonth !== 0 ?
                  `Belum ada data biaya operasional untuk ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}.` :
                  'Silakan pilih bulan terlebih dahulu.'
                }
              </div>
            ) : (
              <div className="space-y-3">
                {currentItems.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-lg border p-4"
                    style={{ borderColor: '#3D4558', backgroundColor: '#2D3548' }}
                  >
                    {/* Expense Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1" style={{ color: '#FFFFFF' }}>
                          {expense.description}
                        </h3>
                        <p className="text-sm" style={{ color: '#B8BFCC' }}>
                          {formatDate(expense.date)}
                        </p>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Jumlah</p>
                        <p className="font-semibold text-lg" style={{ color: '#FFFFFF' }}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <ExpenseForm
                          expense={expense}
                          onSuccess={fetchExpenses}
                          trigger={
                            <Button variant="outline" size="sm" className="custom-btn h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="custom-btn h-8 w-8 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-full max-w-[90vw] sm:max-w-[400px] md:max-w-[425px]" style={{ backgroundColor: '#1B2336', borderColor: '#3D4558' }}>
                            <AlertDialogHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
                              <AlertDialogTitle className="text-base sm:text-lg font-semibold" style={{ color: '#FFFFFF' }}>
                                Hapus Biaya
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-xs sm:text-sm" style={{ color: '#B8BFCC' }}>
                                Apakah Anda yakin ingin menghapus biaya &quot;{expense.description}&quot;?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="px-3 sm:px-4 pb-3 sm:pb-4 gap-2 sm:gap-3">
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExpense(expense.id!)}
                                className="custom-btn flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                                style={{ backgroundColor: '#EF4444' }}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block rounded-lg border table-container-rounded" style={{ borderColor: '#3D4558', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Deskripsi</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Jumlah</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal</TableHead>
                  <TableHead className="text-right" style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {selectedMonth !== 0 ?
                        `Belum ada data biaya operasional untuk ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}.` :
                        'Silakan pilih bulan terlebih dahulu.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((expense) => (
                    <TableRow key={expense.id} className="table-row-hover">
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{expense.description}</TableCell>
                      <TableCell className="font-semibold" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <ExpenseForm
                            expense={expense}
                            onSuccess={fetchExpenses}
                            trigger={
                              <Button variant="outline" size="sm" className="custom-btn">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="custom-btn">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-full max-w-[90vw] sm:max-w-[400px] md:max-w-[425px]" style={{ backgroundColor: '#1B2336', borderColor: '#3D4558' }}>
                              <AlertDialogHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
                                <AlertDialogTitle className="text-base sm:text-lg font-semibold" style={{ color: '#FFFFFF' }}>
                                  Hapus Biaya
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm" style={{ color: '#B8BFCC' }}>
                                  Apakah Anda yakin ingin menghapus biaya &quot;{expense.description}&quot;?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="px-3 sm:px-4 pb-3 sm:pb-4 gap-2 sm:gap-3">
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExpense(expense.id!)}
                                  className="custom-btn flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
                                  style={{ backgroundColor: '#EF4444' }}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-300">
            Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, filteredExpenses.length)} dari {filteredExpenses.length} biaya
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="custom-btn px-3 py-1"
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`custom-btn px-3 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="custom-btn px-3 py-1"
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}