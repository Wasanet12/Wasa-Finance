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
import { Badge } from '@/components/ui/badge';
import { CustomerForm } from '@/components/wasa/customer-form';
import { MarkUnpaidForm } from '@/components/wasa/mark-unpaid-form';
import { Customer } from '@/lib/types';
import { getCustomers, deleteCustomer } from '@/lib/firestore';
import { generateCustomerPDFReport } from '@/utils/pdfLoader';
import { formatDate, formatCurrency, toDate } from '@/utils/dateUtils';
import { Search, Edit, Trash2, Users, UserCheck, DollarSign, Building2, Tag, Download, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
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

  // Reset to page 1 when filtered customers change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCustomers]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const customersResult = await getCustomers();
      if (customersResult.success && customersResult.data) {
        // Sort customers by createdAt descending (newest first)
        const sortedCustomers = customersResult.data.sort((a, b) => {
          const dateA = toDate(a.createdAt);
          const dateB = toDate(b.createdAt);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        setCustomers(sortedCustomers);
      } else {
        console.error('Error fetching customers:', customersResult.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const deleteResult = await deleteCustomer(customerId);
      if (deleteResult.success) {
        fetchCustomers();
      } else {
        console.error('Error deleting customer:', deleteResult.error);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const getStatusBadge = (status: Customer['status']) => {
    const styles = {
      'active': { backgroundColor: '#10B981', color: '#FFFFFF' },
      'inactive': { backgroundColor: '#EF4444', color: '#FFFFFF' },
      'Belum Bayar': { backgroundColor: '#F59E0B', color: '#FFFFFF' },
      'pending': { backgroundColor: '#8B5CF6', color: '#FFFFFF' },
      'Off': { backgroundColor: '#6B7280', color: '#FFFFFF' },
    };

    // Handle undefined style gracefully
    const style = styles[status] || { backgroundColor: '#1B2336', color: '#FFFFFF' };

    // Display name mapping
    const displayNames = {
      'active': 'Aktif',
      'inactive': 'Tidak Aktif',
      'Belum Bayar': 'Belum Bayar',
      'pending': 'Pending',
      'Off': 'Off',
    };

    const displayName = displayNames[status] || status;

    return (
      <Badge
        style={style}
        className="px-2 py-1 text-xs"
      >
        {displayName}
      </Badge>
    );
  };

  const getPaymentTargetBadge = (target: Customer['paymentTarget']) => {
    return (
      <Badge
        style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}
        className="px-2 py-1 text-xs"
      >
        {target}
      </Badge>
    );
  };

  
  const getDiscountDisplay = (customer: Customer) => {
    if (!customer.discountAmount || customer.discountAmount === 0) {
      return '-';
    }
    return `Rp ${customer.discountAmount.toLocaleString('id-ID')}`;
  };

  const getPriceDisplay = (customer: Customer) => {
    if (customer.discountAmount && customer.discountAmount > 0) {
      const discountedPrice = customer.packagePrice - customer.discountAmount;
      return (
        <div>
          <div className="font-semibold">
            {formatCurrency(discountedPrice)}
          </div>
          <div className="text-xs line-through" style={{ color: '#B8BFCC' }}>
            {formatCurrency(customer.packagePrice)}
          </div>
        </div>
      );
    }
    return formatCurrency(customer.packagePrice);
  };

  
  const canMarkAsUnpaid = (customer: Customer) => {
    // Only active customers can be marked as unpaid
    return customer.status === 'active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalCustomers = filteredCustomers.length;
  const activeCustomers = filteredCustomers.filter(customer => customer.status === 'active').length;
  const inactiveCustomers = filteredCustomers.filter(customer => customer.status === 'inactive').length;
  const customersPayToWasa = filteredCustomers.filter(customer => customer.status === 'active' && (customer.paymentTarget === 'Wasa' || !customer.paymentTarget)).length;
  const customersPayToOffice = filteredCustomers.filter(customer => customer.status === 'active' && customer.paymentTarget === 'Kantor').length;
  const totalRevenue = filteredCustomers
    .filter(customer => customer.status === 'active')
    .reduce((sum, customer) => sum + customer.packagePrice, 0);
  const totalDiscount = filteredCustomers
    .filter(customer => customer.discountAmount && customer.discountAmount > 0)
    .reduce((sum, customer) => sum + customer.discountAmount, 0);

  const handleDownloadPDF = async () => {
    try {
      await generateCustomerPDFReport(filteredCustomers, 'Daftar Semua Pelanggan', `Daftar-Pelanggan-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('Customer PDF report generated successfully');
    } catch (error) {
      console.error('Error generating customer PDF report:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#1B2336' }} />
          <h1 className="text-xl sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#1B2336' }}>
            Semua Pelanggan
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
          <CustomerForm onSuccess={fetchCustomers} />
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">Customer Summary</h2>
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Pelanggan
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {totalCustomers}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              {activeCustomers} aktif, {inactiveCustomers} tidak aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Dari {activeCustomers} pelanggan aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Bayar ke Wasa
            </CardTitle>
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {customersPayToWasa}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Pelanggan aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Bayar ke Kantor
            </CardTitle>
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {customersPayToOffice}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Pelanggan aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Diskon
            </CardTitle>
            <Tag className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalDiscount)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Total diskon semua pelanggan
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="customer-table-heading">
        <h2 id="customer-table-heading" className="sr-only">Customer List Table</h2>
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ color: '#FFFFFF' }}>
            <span className="text-lg sm:text-xl">Daftar Pelanggan</span>
            <div className="text-sm font-normal" style={{ color: '#FFFFFF' }}>
              Total: {filteredCustomers.length} pelanggan
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Search Section */}
          <div className="mb-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: '#FFFFFF' }} />
                <Input
                  placeholder="Cari pelanggan..."
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
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
                {searchTerm
                  ? 'Tidak ada pelanggan yang cocok dengan pencarian.'
                  : 'Belum ada data pelanggan.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
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
                      <div className="flex gap-1">
                        {getStatusBadge(customer.status)}
                        {getPaymentTargetBadge(customer.paymentTarget)}
                      </div>
                    </div>

                    {/* Price and Discount */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Harga</p>
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

                    {/* Date and Actions */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs" style={{ color: '#B8BFCC' }}>Tanggal</p>
                        <p className="text-sm" style={{ color: '#FFFFFF' }}>
                          {formatDate(customer.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {canMarkAsUnpaid(customer) && (
                          <MarkUnpaidForm
                            customer={customer}
                            onSuccess={fetchCustomers}
                            trigger={
                              <Button variant="outline" size="sm" className="custom-btn h-11 w-11 p-0" style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#FFFFFF' }}>
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                        <CustomerForm
                          customer={customer}
                          onSuccess={fetchCustomers}
                          trigger={
                            <Button variant="outline" size="sm" className="custom-btn h-11 w-11 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="custom-btn h-11 w-11 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pelanggan &quot;{customer.name}&quot;?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCustomer(customer.id!)}
                                className="custom-btn"
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
          <div className="hidden lg:block rounded-lg border table-container-rounded overflow-x-auto" style={{ borderColor: '#3D4558', borderRadius: '0.5rem' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Nama</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Paket</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Harga</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Diskon</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Status</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Bayar ke</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal</TableHead>
                  <TableHead className="text-right" style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={8} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {searchTerm
                        ? 'Tidak ada pelanggan yang cocok dengan pencarian.'
                        : 'Belum ada data pelanggan.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((customer) => (
                    <TableRow key={customer.id} className="table-row-hover">
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{customer.name}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{customer.packageName}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getPriceDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getDiscountDisplay(customer)}</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>{getPaymentTargetBadge(customer.paymentTarget)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {canMarkAsUnpaid(customer) && (
                            <MarkUnpaidForm
                              customer={customer}
                              onSuccess={fetchCustomers}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="custom-btn h-11 min-w-[44px] px-3"
                                  title="Tandai sebagai Belum Bayar"
                                  style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#FFFFFF' }}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              }
                            />
                          )}
                          <CustomerForm
                            customer={customer}
                            onSuccess={fetchCustomers}
                            trigger={
                              <Button variant="outline" size="sm" className="custom-btn h-11 min-w-[44px] px-3">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="custom-btn h-11 min-w-[44px] px-3">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pelanggan &quot;{customer.name}&quot;?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCustomer(customer.id!)}
                                  className="custom-btn"
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
        <div className="flex flex-col items-center justify-center mt-4 gap-2 px-4">
          <div className="text-sm text-gray-300 pagination-info">
            Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
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
                opacity: 1,
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
                opacity: 1,
                pointerEvents: currentPage === totalPages ? 'none' : 'auto'
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}