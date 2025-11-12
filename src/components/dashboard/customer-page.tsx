'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Plus, Calendar, Users } from 'lucide-react';
import { Customer } from '@/lib/types';
import { services } from '@/lib/firestore';
import { formatDate, formatCurrency } from '@/utils/dateUtils';
import Link from 'next/link';
import { COLORS } from '@/constants';
import { CustomerForm } from '@/components/wasa/customer-form';

interface CustomerPageProps {
  status: 'all' | 'active' | 'inactive' | 'pending';
  title: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function CustomerPage({ status, title, description }: CustomerPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      switch (status) {
        case 'active':
          response = await services.customer.getByStatus('active');
          break;
        case 'inactive':
          response = await services.customer.getByStatus('inactive');
          break;
        case 'pending':
          response = await services.customer.getByStatus('pending');
          break;
        default:
          response = await services.customer.getAll();
      }

      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        console.error(`Failed to fetch ${status} customers:`, response.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error(`Error fetching ${status} customers:`, error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
      try {
        const response = await services.customer.delete(id);
        if (response.success) {
          fetchCustomers();
        } else {
          alert('Gagal menghapus pelanggan: ' + response.error);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Terjadi kesalahan saat menghapus pelanggan');
      }
    }
  };

  // Filter customers based on search term - comprehensive search across multiple fields
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true; // If no search term, show all
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.packageName && customer.packageName.toLowerCase().includes(searchLower)) ||
      customer.packagePrice.toString().includes(searchLower) ||
      (customer.paymentTarget && customer.paymentTarget.toLowerCase().includes(searchLower)) ||
      customer.status.toLowerCase().includes(searchLower) ||
      (customer.phoneNumber && customer.phoneNumber.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
      (customer.notes && customer.notes.toLowerCase().includes(searchLower))
    );
  });

  // Calculate metrics
  const totalCustomers = filteredCustomers.length;
  const totalRevenue = filteredCustomers.reduce((sum, customer) => sum + customer.packagePrice, 0);
  const wasaRevenue = filteredCustomers
    .filter(customer => customer.paymentTarget === 'Wasa')
    .reduce((sum, customer) => sum + customer.packagePrice, 0);
  const kantorRevenue = filteredCustomers
    .filter(customer => customer.paymentTarget === 'Kantor')
    .reduce((sum, customer) => sum + customer.packagePrice, 0);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex flex-col sm:flex-row md:items-center md:justify-between gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold" style={{ color: '#1B2336' }}>{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>
        </div>
        <CustomerForm
          onSuccess={fetchCustomers}
          trigger={
            <Button
              style={{
                backgroundColor: '#1B2336',
                color: '#FFFFFF',
                borderColor: '#3D4558',
                minHeight: '44px',
              }}
              className="flex items-center space-x-2 px-4 py-2 text-sm sm:text-base hover:bg-opacity-90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pelanggan</span>
            </Button>
          }
        />
      </div>

      {/* Metrics Cards */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.PRIMARY }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight" style={{ color: COLORS.WHITE }}>
                Total Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-lg md:text-xl lg:text-2xl font-bold break-all leading-tight" style={{ color: COLORS.WHITE }}>
                {totalCustomers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.PRIMARY }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight" style={{ color: COLORS.WHITE }}>
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-lg md:text-xl lg:text-2xl font-bold break-all leading-tight" style={{ color: COLORS.WHITE }}>
                {formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.PRIMARY }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight" style={{ color: COLORS.WHITE }}>
                Pendapatan Wasa
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-lg md:text-xl lg:text-2xl font-bold break-all leading-tight" style={{ color: COLORS.WHITE }}>
                {formatCurrency(wasaRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.PRIMARY }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight" style={{ color: COLORS.WHITE }}>
                Pendapatan Kantor
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-4 sm:pb-5">
              <div className="text-lg md:text-xl lg:text-2xl font-bold break-all leading-tight" style={{ color: COLORS.WHITE }}>
                {formatCurrency(kantorRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D5DB',
                color: '#1B2336'
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-3 sm:px-4 lg:px-6">
        <Card className="border-border shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: COLORS.PRIMARY }}>
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center space-x-2 sm:space-x-3" style={{ color: COLORS.WHITE }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#3B82F620' }}>
                <Users className="h-5 w-5" style={{ color: COLORS.WHITE }} />
              </div>
              <span className="text-sm sm:text-base font-semibold">Daftar Pelanggan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {loading ? (
              <div className="text-center py-8" style={{ color: COLORS.WHITE }}>
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span>Memuat...</span>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8" style={{ color: COLORS.WHITE }}>
                <div className="flex flex-col items-center space-y-2">
                  <Users className="h-8 w-8 mx-auto" style={{ color: COLORS.WHITE }} />
                  <span>
                    {searchTerm ? 'Tidak ada pelanggan yang cocok dengan pencarian.' : `Tidak ada pelanggan ${status}.`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: '#0F1725', borderColor: COLORS.BORDER }}>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: '#1E293B' }}>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Nama</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Paket</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right leading-tight" style={{ color: COLORS.WHITE }}>Harga</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Target</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Status</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Tanggal Buat</TableHead>
                          <TableHead className="py-3 px-4 text-xs font-semibold uppercase tracking-wider leading-tight" style={{ color: COLORS.WHITE }}>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer.id} className="border-b last:border-b-0 hover:bg-white/5 transition-colors" style={{ borderColor: COLORS.BORDER }}>
                            <TableCell className="py-3 px-4 font-medium" style={{ color: COLORS.WHITE }}>
                              {customer.name}
                            </TableCell>
                            <TableCell className="py-3 px-4" style={{ color: COLORS.WHITE }}>
                              {customer.packageName}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-semibold" style={{ color: COLORS.WHITE }}>
                              {formatCurrency(customer.packagePrice)}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: customer.paymentTarget === 'Wasa' ? '#3B82F620' : '#10B98120',
                                  color: COLORS.WHITE
                                }}
                              >
                                {customer.paymentTarget}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    customer.status === 'active' ? '#10B98120' :
                                    customer.status === 'inactive' ? '#EF444420' :
                                    '#F59E0B20',
                                  color: COLORS.WHITE
                                }}
                                title={customer.status === 'active' ? 'Berlangganan aktif' :
                                       customer.status === 'inactive' ? 'Berlangganan tidak aktif' :
                                       customer.status}
                              >
                                {customer.status === 'active' ? 'Aktif' :
                                 customer.status === 'inactive' ? 'Tidak Aktif' :
                                 customer.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" style={{ color: COLORS.WHITE }} />
                                <span style={{ color: COLORS.WHITE }}>{formatDate(customer.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Link href={`/dashboard/customers/${customer.id}/edit`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-white/10 border-gray-600"
                                    style={{
                                      borderColor: '#4B5563',
                                      color: COLORS.WHITE
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-red-600/20 border-red-600"
                                  style={{
                                    borderColor: '#EF4444',
                                    color: '#EF4444'
                                  }}
                                  onClick={() => handleDelete(customer.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}