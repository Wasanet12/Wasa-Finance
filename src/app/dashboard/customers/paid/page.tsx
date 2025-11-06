"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { UserCheck, DollarSign, Building2, CreditCard, Building, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, toDate } from '@/utils/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PaidCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPaidCustomers();
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

  // Reset to page 1 when customers change
  useEffect(() => {
    setCurrentPage(1);
  }, [customers]);

  const fetchPaidCustomers = async () => {
    try {
      // Firebase uses "active" for paid customers
      // Show ALL active customers regardless of when they were created
      const response = await services.customer.getByStatus('active');
      if (response.success && response.data) {
        // Sort customers by createdAt descending (newest first)
        const sortedCustomers = response.data.sort((a, b) => {
          const dateA = toDate(a.createdAt);
          const dateB = toDate(b.createdAt);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        setCustomers(sortedCustomers);
      } else {
        console.error('Failed to fetch paid customers:', response.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching paid customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);
  const wasaRevenue = customers
    .filter(customer => customer.paymentTarget === 'Wasa')
    .reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);
  const officeRevenue = customers
    .filter(customer => customer.paymentTarget === 'Kantor')
    .reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    try {
      // Create a temporary array with the customers for PDF generation
      const pdfData = {
        customers: customers,
        title: 'Daftar Pelanggan Aktif'
      };

      // You can implement PDF generation here if needed
      console.log('PDF data prepared:', pdfData);
      alert(`PDF akan menampilkan ${customers.length} pelanggan aktif`);
    } catch (error) {
      console.error('Error preparing PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <UserCheck className="h-6 w-6" style={{ color: '#1B2336' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#1B2336' }}>Pelanggan Aktif</h1>
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadPDF}
          className="custom-btn flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base"
          style={{
            minHeight: '44px', // Touch-friendly size
          }}
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">Unduh PDF</span>
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Dari {customers.length} pelanggan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Pendapatan Wasa
            </CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(wasaRevenue)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              {customers.filter(c => c.paymentTarget === 'Wasa').length} pelanggan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Pendapatan Kantor
            </CardTitle>
            <Building2 className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(officeRevenue)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              {customers.filter(c => c.paymentTarget === 'Kantor').length} pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Target Labels */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Pembayaran ke Wasa
            </CardTitle>
            <CreditCard className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(wasaRevenue)}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1"
                style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}
              >
                <CreditCard className="h-3 w-3" />
                <span>{customers.filter(c => c.paymentTarget === 'Wasa').length} Pelanggan</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Pembayaran ke Kantor
            </CardTitle>
            <Building className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(officeRevenue)}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1"
                style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}
              >
                <Building className="h-3 w-3" />
                <span>{customers.filter(c => c.paymentTarget === 'Kantor').length} Pelanggan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader>
          <CardTitle style={{ color: '#FFFFFF' }}>Daftar Pelanggan Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border table-container-rounded" style={{ borderColor: '#3D4558', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Nama</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Paket</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Harga</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Bayar ke</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={5} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Belum ada pelanggan yang sudah bayar.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((customer) => (
                    <TableRow key={customer.id} className="table-row-hover">
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{customer.name}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{customer.packageName}</TableCell>
                      <TableCell className="font-semibold" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(customer.packagePrice - customer.discountAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}
                          className="px-2 py-1 text-xs"
                        >
                          {customer.paymentTarget}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(customer.createdAt)}</TableCell>
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
            Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, customers.length)} dari {customers.length} pelanggan
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