"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { UserCheck, DollarSign, Building2, CreditCard, Building } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/utils/dateUtils';

export default function PaidCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaidCustomers();
  }, []);

  const fetchPaidCustomers = async () => {
    try {
      // Firebase uses "active" instead of "Sudah Bayar"
      const response = await services.customer.getByStatus('active');
      if (response.success && response.data) {
        setCustomers(response.data);
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

  
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.packagePrice, 0);
  const wasaRevenue = customers
    .filter(customer => customer.paymentTarget === 'Wasa')
    .reduce((sum, customer) => sum + customer.packagePrice, 0);
  const officeRevenue = customers
    .filter(customer => customer.paymentTarget === 'Kantor')
    .reduce((sum, customer) => sum + customer.packagePrice, 0);

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
        <UserCheck className="h-6 w-6" style={{ color: '#1B2336' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#1B2336' }}>Pelanggan Sudah Bayar</h1>
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
          <CardTitle style={{ color: '#FFFFFF' }}>Daftar Pelanggan Sudah Bayar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border" style={{ borderColor: '#3D4558' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: '#FFFFFF' }}>Nama</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Paket</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Harga</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Bayar ke</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Belum ada pelanggan yang sudah bayar.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
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
    </div>
  );
}