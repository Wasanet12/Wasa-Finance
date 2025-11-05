"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { UserCheck, DollarSign, Building2, CreditCard, Building, Download } from 'lucide-react';
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
      // Firebase uses "active" for paid customers
      // Show ALL active customers regardless of when they were created
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
          style={{
            backgroundColor: '#1B2336',
            color: '#FFFFFF',
            borderColor: '#3D4558',
          }}
          className="flex items-center space-x-2 px-4 py-2 hover:bg-opacity-90 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
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