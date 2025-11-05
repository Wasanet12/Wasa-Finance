"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Expense } from '@/lib/types';
import { services } from '@/lib/firestore';
import { dateToTimestamp } from '@/lib/firestore';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const expenseSchema = z.object({
  description: z.string().min(1, 'Deskripsi biaya wajib diisi'),
  amount: z.number().min(0, 'Jumlah harus lebih dari 0'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ExpenseForm({ expense, onSuccess, trigger }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      date: expense?.date ? expense.date.toDate().toISOString().split('T')[0] : '',
      category: expense?.category || 'Operasional',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      const expenseData = {
        ...data,
        date: dateToTimestamp(new Date(data.date)),
        subcategory: '',
        paymentMethod: '',
        receiptNumber: '',
        vendorName: '',
        notes: '',
        tags: [],
      };

      if (expense?.id) {
        const updateResult = await services.expense.update(expense.id, expenseData);
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update expense');
        }
      } else {
        const addResult = await services.expense.create(expenseData);
        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to create expense');
        }
      }
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base hover:bg-opacity-90 transition-colors"
            style={{
              backgroundColor: '#1B2336',
              color: '#FFFFFF',
              borderColor: '#3D4558',
              minHeight: '44px', // Touch-friendly size
            }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Tambah Biaya</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#FFFFFF' }}>
            {expense ? 'Edit Biaya' : 'Tambah Biaya Baru'}
          </DialogTitle>
          <DialogDescription style={{ color: '#FFFFFF' }}>
            {expense
              ? 'Edit informasi biaya operasional yang sudah ada.'
              : 'Tambahkan biaya operasional baru ke dalam sistem.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Deskripsi Biaya</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Sewa kantor, Listrik, Internet"
                      value={field.value === 0 ? '' : field.value}
                      onChange={field.onChange}
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                    />
                  </FormControl>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Jumlah (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                                            value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(0);
                        } else {
                          const parsedValue = parseInt(value);
                          field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
                        }
                      }}
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                    />
                  </FormControl>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Tanggal</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value === 0 ? '' : field.value}
                      onChange={field.onChange}
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                      className="date-input-white"
                    />
                  </FormControl>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}>
                        <SelectValue placeholder="Pilih kategori" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      <SelectItem value="Operasional" style={{ color: '#FFFFFF' }}>Operasional</SelectItem>
                      <SelectItem value="Marketing" style={{ color: '#FFFFFF' }}>Marketing</SelectItem>
                      <SelectItem value="Infrastruktur" style={{ color: '#FFFFFF' }}>Infrastruktur</SelectItem>
                      <SelectItem value="Gaji" style={{ color: '#FFFFFF' }}>Gaji</SelectItem>
                      <SelectItem value="Lainnya" style={{ color: '#FFFFFF' }}>Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  borderColor: '#3D4558'
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF'
                }}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}