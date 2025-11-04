"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { PauseCircle, Edit } from 'lucide-react';
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
import { formatDate } from '@/utils/dateUtils';

export default function OffCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffCustomers();
  }, []);

  const fetchOffCustomers = async () => {
    try {
      // Firebase uses "inactive" instead of "Off"
      const response = await services.customer.getByStatus('inactive');
      if (response.success && response.data) {
        setCustomers(response.data);
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
          <div className="rounded-md border" style={{ borderColor: '#3D4558' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: '#FFFFFF' }}>Nama</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Paket Terakhir</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Harga Terakhir</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Diskon</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tujuan Bayar</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal Off</TableHead>
                  <TableHead className="text-right" style={{ color: '#FFFFFF' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      Tidak ada pelanggan dengan status Off.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
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
