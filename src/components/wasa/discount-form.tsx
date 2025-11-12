"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { services } from '@/lib/firestore';
import { Customer } from '@/lib/types';
import { Percent } from 'lucide-react';

const discountSchema = z.object({
  discountAmount: z.number().min(0, 'Diskon tidak boleh negatif'),
});

type DiscountFormData = z.infer<typeof discountSchema>;

interface DiscountFormProps {
  customer: Customer;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DiscountForm({ customer, onSuccess, trigger }: DiscountFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      discountAmount: customer.discountAmount || 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        discountAmount: customer.discountAmount || 0,
      });
    }
  }, [open, customer.discountAmount, form]);

  const calculateFinalPrice = (packagePrice: number, discountAmount: number) => {
    return packagePrice - discountAmount;
  };

  const onSubmit = async (data: DiscountFormData) => {
    setLoading(true);
    try {
      const updateData = {
        discountAmount: data.discountAmount,
      };

      const response = await services.customer.update(customer.id!, updateData);

      if (response.success) {
        setOpen(false);
        form.reset();
        onSuccess?.();
      } else {
        console.error('Failed to update discount:', response.error);
      }
    } catch (error) {
      console.error('Error updating discount:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDiscount = form.watch('discount');
  const calculatedFinalPrice = calculateFinalPrice(customer.packagePrice, currentDiscount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            style={{
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              borderColor: '#3D4558'
            }}
          >
            <Percent className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#FFFFFF' }}>
            Atur Diskon Pelanggan
          </DialogTitle>
          <DialogDescription style={{ color: '#FFFFFF' }}>
            Berikan diskon untuk {customer.name}. Harga paket: Rp {customer.packagePrice.toLocaleString('id-ID')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="discountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Diskon (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max={customer.packagePrice}
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

            {/* Price Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                Preview Harga
              </label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#FFFFFF' }}>Harga Awal:</span>
                  <span style={{ color: '#FFFFFF' }}>
                    Rp {customer.packagePrice.toLocaleString('id-ID')}
                  </span>
                </div>
                {currentDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#FFFFFF' }}>Diskon:</span>
                    <span style={{ color: '#FFFFFF' }}>
                      -Rp {currentDiscount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-1" style={{ borderColor: '#3D4558' }}>
                  <span style={{ color: '#FFFFFF' }}>Harga Final:</span>
                  <span style={{ color: '#FFFFFF' }}>
                    Rp {calculatedFinalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

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
                {loading ? 'Menyimpan...' : 'Simpan Diskon'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}