"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { UserX, AlertTriangle, TrendingUp, Edit, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { CustomerForm } from '@/components/wasa/customer-form';

export default function UnpaidCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchUnpaidCustomers();
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

  const fetchUnpaidCustomers = async () => {
    try {
      // Get customers with "Belum Bayar" status
      const response = await services.customer.getByStatus('Belum Bayar');
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
        console.error('Failed to fetch unpaid customers:', response.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching unpaid customers:', error);
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

  const totalPendingRevenue = customers.reduce((sum, customer) => sum + customer.packagePrice, 0);

  const totalUnpaidDiscount = customers
    .filter(customer => customer.discountAmount && customer.discountAmount > 0)
    .reduce((sum, customer) => sum + customer.discountAmount, 0);

  const getDiscountDisplay = (customer: Customer) => {
    if (!customer.discountAmount || customer.discountAmount === 0) {
      return '-';
    }
    return `Rp ${customer.discountAmount.toLocaleString('id-ID')}`;
  };

  const getPriceDisplay = (customer: Customer) => {
    const finalPrice = customer.packagePrice - customer.discountAmount;
    if (customer.discountAmount && customer.discountAmount > 0) {
      return (
        <div>
          <div className="line-through text-sm" style={{ color: '#A0A8B8' }}>
            {formatCurrency(customer.packagePrice)}
          </div>
          <div className="font-semibold">
            {formatCurrency(finalPrice)}
          </div>
        </div>
      );
    }
    return formatCurrency(customer.packagePrice);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <UserX className="h-6 w-6" style={{ color: '#1B2336' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#1B2336' }}>Pelanggan Belum Bayar</h1>
      </div>

      {/* Pending Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Pendapatan Tertunda
            </CardTitle>
            <AlertTriangle className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalPendingRevenue)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Dari {customers.length} pelanggan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Potensi Laba Wasa
            </CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalPendingRevenue * 0.4)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              40% dari total pendapatan tertunda
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Diskon
            </CardTitle>
            <Percent className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalUnpaidDiscount)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Total diskon pelanggan belum bayar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader>
          <CardTitle style={{ color: '#FFFFFF' }}>Daftar Pelanggan Belum Bayar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border table-container-rounded" style={{ borderColor: '#3D4558', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Nama</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Paket</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Harga</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Diskon</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tujuan Bayar</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal Daftar</TableHead>
                  <TableHead className="text-right" style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={7} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Semua pelanggan sudah melakukan pembayaran.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((customer) => (
                    <TableRow key={customer.id} className="table-row-hover">
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{customer.name}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{customer.packageName}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getPriceDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getDiscountDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>
                        <Badge className="px-2 py-1 text-xs" style={{ backgroundColor: "#FFFFFF", color: "#1B2336" }}>
                          {customer.paymentTarget}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <CustomerForm
                          customer={customer}
                          onSuccess={fetchUnpaidCustomers}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="custom-btn"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
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
        <div className="flex flex-col items-center justify-center mt-4 gap-2 px-4">
          <div className="text-sm text-gray-300 pagination-info">
            Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, customers.length)} dari {customers.length} pelanggan
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="pagination-nav-btn px-3 py-1"
              size="sm"
              style={{
                backgroundColor: currentPage === 1 ? '#1B2336' : '#FFFFFF',
                color: currentPage === 1 ? '#A0A8B8' : '#1B2336',
                borderColor: currentPage === 1 ? '#1B2336' : '#FFFFFF',
                opacity: currentPage === 1 ? 0.5 : 1,
                pointerEvents: currentPage === 1 ? 'none' : 'auto'
              }}
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
                    className={`pagination-page-btn px-3 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'active'
                        : ''
                    }`}
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
              className="pagination-nav-btn px-3 py-1"
              size="sm"
              style={{
                backgroundColor: currentPage === totalPages ? '#1B2336' : '#FFFFFF',
                color: currentPage === totalPages ? '#A0A8B8' : '#1B2336',
                borderColor: currentPage === totalPages ? '#1B2336' : '#FFFFFF',
                opacity: currentPage === totalPages ? 0.5 : 1,
                pointerEvents: currentPage === totalPages ? 'none' : 'auto'
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
