"use client";

import { useEffect, useState } from 'react';
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
import { formatDate, formatCurrency } from '@/utils/dateUtils';
import { Search, Edit, Trash2, DollarSign, TrendingDown, Download } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const filtered = expenses.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm]);

  const fetchExpenses = async () => {
    try {
      const response = await services.expense.getAll();
      if (response.success && response.data) {
        setExpenses(response.data);
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

  
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpenses = filteredExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const handleDownloadPDF = () => {
    try {
      generateExpensePDFReport(filteredExpenses, `Laporan-Biaya-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('Expense PDF report generated successfully');
    } catch (error) {
      console.error('Error generating expense PDF report:', error);
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
              Biaya Bulan Ini
            </CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(currentMonthExpenses)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Search Section */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: '#FFFFFF' }} />
              <Input
                placeholder="Cari biaya..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-10"
                style={{
                  backgroundColor: '#2D3548',
                  color: '#FFFFFF',
                  borderColor: '#3D4558'
                }}
              />
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
                {searchTerm
                  ? 'Tidak ada biaya yang cocok dengan pencarian.'
                  : 'Belum ada data biaya operasional.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
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
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Biaya</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus biaya &quot;{expense.description}&quot;?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExpense(expense.id!)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          <div className="hidden lg:block rounded-md border" style={{ borderColor: '#3D4558' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: '#FFFFFF' }}>Deskripsi</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Jumlah</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal</TableHead>
                  <TableHead className="text-right" style={{ color: '#FFFFFF' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {searchTerm
                        ? 'Tidak ada biaya yang cocok dengan pencarian.'
                        : 'Belum ada data biaya operasional.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
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
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Biaya</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus biaya &quot;{expense.description}&quot;?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExpense(expense.id!)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );
}