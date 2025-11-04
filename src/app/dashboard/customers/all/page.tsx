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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerForm } from '@/components/wasa/customer-form';
import { MarkUnpaidForm } from '@/components/wasa/mark-unpaid-form';
import { Customer } from '@/lib/types';
import { getCustomers, deleteCustomer } from '@/lib/firestore';
import { generateCustomerPDFReport } from '@/utils/pdfGenerator';
import { formatDate, formatCurrency, toDate } from '@/utils/dateUtils';
import { Search, Edit, Trash2, Users, UserCheck, DollarSign, Building2, Tag, Download, AlertCircle, Filter, ArrowUpDown } from 'lucide-react';

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => {
        if (statusFilter === 'pending') {
          return customer.status === 'pending' || customer.status === 'Belum Bayar';
        }
        return customer.status === statusFilter;
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.packagePrice - a.packagePrice;
        case 'date':
        default:
          const dateA = toDate(a.createdAt) || new Date(0);
          const dateB = toDate(b.createdAt) || new Date(0);
          return dateB.getTime() - dateA.getTime();
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter, sortBy]);

  const fetchCustomers = async () => {
    try {
      const customersResult = await getCustomers();
      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
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

  const getStatusBadge = (status: Customer['status']) => {
    const styles = {
      'active': { backgroundColor: '#10B981', color: '#FFFFFF' },
      'inactive': { backgroundColor: '#EF4444', color: '#FFFFFF' },
      'pending': { backgroundColor: '#F59E0B', color: '#FFFFFF' }, // Belum Bayar
      'Sudah Bayar': { backgroundColor: '#10B981', color: '#FFFFFF' },
      'Belum Bayar': { backgroundColor: '#F59E0B', color: '#FFFFFF' },
      'Off': { backgroundColor: '#6B7280', color: '#FFFFFF' },
    };

    // Handle undefined style gracefully
    const style = styles[status] || { backgroundColor: '#1B2336', color: '#FFFFFF' };

    // Display name mapping
    const displayNames = {
      'active': 'Aktif',
      'inactive': 'Tidak Aktif',
      'pending': 'Belum Bayar',
      'Sudah Bayar': 'Sudah Bayar',
      'Belum Bayar': 'Belum Bayar',
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
    return customer.status === 'active' || customer.status === 'Sudah Bayar';
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

  const handleDownloadPDF = () => {
    try {
      generateCustomerPDFReport(filteredCustomers, 'Daftar Semua Pelanggan', `Daftar-Pelanggan-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('Customer PDF report generated successfully');
    } catch (error) {
      console.error('Error generating customer PDF report:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#1B2336' }} />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#1B2336' }}>
            Semua Pelanggan
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
          <CustomerForm onSuccess={fetchCustomers} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Pelanggan
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
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
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
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
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
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
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
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
            <div className="text-lg sm:text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalDiscount)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Total diskon semua pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

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
          {/* Search and Filter Section */}
          <div className="space-y-4 mb-4">
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

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" style={{
                    backgroundColor: '#2D3548',
                    color: '#FFFFFF',
                    borderColor: '#3D4558'
                  }}>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="pending">Belum Bayar</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="Sudah Bayar">Sudah Bayar</SelectItem>
                    <SelectItem value="Belum Bayar">Belum Bayar (Lama)</SelectItem>
                    <SelectItem value="Off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'price') => setSortBy(value)}>
                  <SelectTrigger className="w-40" style={{
                    backgroundColor: '#2D3548',
                    color: '#FFFFFF',
                    borderColor: '#3D4558'
                  }}>
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Tanggal Daftar</SelectItem>
                    <SelectItem value="name">Nama</SelectItem>
                    <SelectItem value="price">Harga Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
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
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-yellow-600 border-yellow-600">
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            }
                          />
                        )}
                        <CustomerForm
                          customer={customer}
                          onSuccess={fetchCustomers}
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
                  <TableHead style={{ color: '#FFFFFF' }}>Nama</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Paket</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Harga</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Diskon</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Status</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Bayar ke</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal</TableHead>
                  <TableHead className="text-right" style={{ color: '#FFFFFF' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {searchTerm
                        ? 'Tidak ada pelanggan yang cocok dengan pencarian.'
                        : 'Belum ada data pelanggan.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
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
                                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                  title="Tandai sebagai Belum Bayar"
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