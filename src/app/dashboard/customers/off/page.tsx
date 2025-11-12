"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { PauseCircle, Edit, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatDate, toDate } from '@/utils/dateUtils';
import { generateCustomerPDFReport } from '@/utils/pdfLoader';
import { ReactivateCustomerForm } from '@/components/wasa/reactivate-customer-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OffCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOffCustomers();
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

  const fetchOffCustomers = async () => {
    try {
      // Firebase uses "inactive" instead of "Off"
      const response = await services.customer.getByStatus('inactive');
      if (response.success && response.data) {
        // Sort customers by updatedAt descending (newest first)
        const sortedCustomers = response.data.sort((a, b) => {
          const dateA = toDate(a.updatedAt);
          const dateB = toDate(b.updatedAt);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        setCustomers(sortedCustomers);
      } else {
        console.error('Failed to fetch off customers:', response.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching off customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  
  
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
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(customer.packagePrice)}
          </div>
          <div className="font-semibold">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(finalPrice)}
          </div>
        </div>
      );
    }
    return (
      <div className="line-through">
        {new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(customer.packagePrice)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const handleDownloadPDF = async () => {
    try {
      await generateCustomerPDFReport(customers, 'Daftar Pelanggan Off', `Pelanggan-Off-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('Off customers PDF report generated successfully');
    } catch (error) {
      console.error('Error generating off customers PDF report:', error);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    }
  };

  // Calculate total discount for off customers
  const totalOffDiscount = customers
    .filter(customer => customer.discountAmount && customer.discountAmount > 0)
    .reduce((sum, customer) => sum + customer.discountAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <PauseCircle className="h-6 w-6" style={{ color: '#1B2336' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#1B2336' }}>Pelanggan Off</h1>
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

      {/* Summary Card */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between" style={{ color: '#FFFFFF' }}>
            <span>Ringkasan Pelanggan Off</span>
            <Badge
              style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}
              className="px-2 py-1 text-xs"
            >
              {customers.length} Pelanggan
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{customers.length}</div>
              <p className="text-sm" style={{ color: '#FFFFFF' }}>Total Pelanggan Off</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {customers.filter(c => c.paymentTarget === 'Wasa').length}
              </div>
              <p className="text-sm" style={{ color: '#FFFFFF' }}>Sebelumnya Bayar ke Wasa</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {customers.filter(c => c.paymentTarget === 'Kantor').length}
              </div>
              <p className="text-sm" style={{ color: '#FFFFFF' }}>Sebelumnya Bayar ke Kantor</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(totalOffDiscount)}
              </div>
              <p className="text-sm" style={{ color: '#FFFFFF' }}>Total Diskon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader>
          <CardTitle style={{ color: '#FFFFFF' }}>Daftar Pelanggan Off</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {customers.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
                Tidak ada pelanggan dengan status Off.
              </div>
            ) : (
              <div className="space-y-3">
                {currentItems.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-lg border p-4"
                    style={{ borderColor: '#3D4558', backgroundColor: '#2D3548' }}
                  >
                    {/* Customer Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1" style={{ color: '#FFFFFF' }}>
                          {customer.name}
                        </h3>
                        <p className="text-sm" style={{ color: '#B8BFCC' }}>
                          {customer.packageName}
                        </p>
                      </div>
                    </div>

                    {/* Price and Discount */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Harga Terakhir</p>
                        <div className="font-semibold" style={{ color: '#FFFFFF' }}>
                          {getPriceDisplay(customer)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Diskon</p>
                        <div className="font-semibold" style={{ color: '#FFFFFF' }}>
                          {getDiscountDisplay(customer)}
                        </div>
                      </div>
                    </div>

                    {/* Payment Target and Date */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Tujuan Bayar</p>
                        <Badge
                          style={{ backgroundColor: "#FFFFFF", color: "#1B2336" }}
                          className="px-2 py-1 text-xs mt-1 inline-block"
                        >
                          {customer.paymentTarget}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Tanggal Off</p>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>
                          {formatDate(customer.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <ReactivateCustomerForm
                        customer={customer}
                        onSuccess={fetchOffCustomers}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="custom-btn h-10 w-10 p-0"
                            aria-label="Edit pelanggan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block rounded-lg border table-container-rounded overflow-x-auto" style={{ borderColor: '#3D4558', borderRadius: '0.5rem' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Nama</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Paket Terakhir</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Harga Terakhir</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Diskon</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tujuan Bayar</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal Off</TableHead>
                  <TableHead className="text-right" style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={7} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Tidak ada pelanggan dengan status Off.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((customer) => (
                    <TableRow key={customer.id} className="table-row-hover">
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{customer.name}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{customer.packageName}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getPriceDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getDiscountDisplay(customer)}</TableCell>
                      <TableCell>
                        <Badge
                          style={{ backgroundColor: "#FFFFFF", color: "#1B2336" }}
                          className="px-2 py-1 text-xs"
                        >
                          {customer.paymentTarget}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(customer.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <ReactivateCustomerForm
                          customer={customer}
                          onSuccess={fetchOffCustomers}
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
