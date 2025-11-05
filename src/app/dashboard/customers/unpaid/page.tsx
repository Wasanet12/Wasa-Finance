"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { UserX, AlertTriangle, TrendingUp, Edit, Percent } from 'lucide-react';
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
import { formatDate, formatCurrency } from '@/utils/dateUtils';

export default function UnpaidCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnpaidCustomers();
  }, []);

  const fetchUnpaidCustomers = async () => {
    try {
      // Get customers with "Belum Bayar" status
      const response = await services.customer.getByStatus('Belum Bayar');
      if (response.success && response.data) {
        setCustomers(response.data);
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
          <div className="rounded-md border" style={{ borderColor: '#3D4558' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: '#FFFFFF' }}>Nama</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Paket</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Harga</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Diskon</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tujuan Bayar</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal Daftar</TableHead>
                  <TableHead className="text-right" style={{ color: '#FFFFFF' }}>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Semua pelanggan sudah melakukan pembayaran.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{customer.name}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{customer.packageName}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getPriceDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{getDiscountDisplay(customer)}</TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}><Badge style={{ backgroundColor: "#FFFFFF", color: "#1B2336" }} className="px-2 py-1 text-xs">{customer.paymentTarget}</Badge></TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <CustomerForm
                          customer={customer}
                          onSuccess={fetchUnpaidCustomers}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              style={{
                                backgroundColor: 'transparent',
                                color: '#FFFFFF',
                                borderColor: '#3D4558'
                              }}
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
    </div>
  );
}
