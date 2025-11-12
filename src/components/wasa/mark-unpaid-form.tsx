"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Customer } from '@/lib/types';
import { services } from '@/lib/firestore';
import { formatDate } from '@/utils/dateUtils';
import { DollarSign } from 'lucide-react';

interface MarkUnpaidFormProps {
  customer: Customer;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function MarkUnpaidForm({ customer, onSuccess, trigger }: MarkUnpaidFormProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleMarkAsUnpaid = async () => {
    setLoading(true);
    try {
      // Update customer status to 'Belum Bayar'
      const updateData: Partial<Customer> = {
        status: 'Belum Bayar',
        paymentNotes: `Ditandai sebagai belum bayar pada ${formatDate(new Date())}`
      };

      const updateResult = await services.customer.update(customer.id, updateData);

      if (updateResult.success) {
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }
        console.log(`Customer ${customer.name} marked as unpaid successfully`);
      } else {
        console.error('Error marking customer as unpaid:', updateResult.error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error marking customer as unpaid:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      title="Tandai sebagai Belum Bayar"
      className="custom-btn"
      style={{
        color: '#D97706',
        borderColor: '#D97706'
      }}
    >
      <DollarSign className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent style={{ backgroundColor: '#1B2336' }}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Tandai sebagai Belum Bayar
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-muted-foreground text-sm">
          Apakah Anda yakin ingin menandai pelanggan <strong>{customer.name}</strong> sebagai &quot;Belum Bayar&quot;?
          <br /><br />
          Tindakan ini akan:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Mengubah status pelanggan menjadi &quot;Belum Bayar&quot;</li>
            <li>Menampilkan pelanggan di halaman &quot;Pelanggan Belum Bayar&quot;</li>
            <li>Memberikan kesempatan untuk memberikan diskon</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="custom-btn">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMarkAsUnpaid}
            disabled={loading}
            className="custom-btn"
            style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF'
            }}
          >
            {loading ? 'Memproses...' : 'Ya, Tandai sebagai Belum Bayar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}