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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Customer, Package } from '@/lib/types';
import { Edit } from 'lucide-react';

const reactivateCustomerSchema = z.object({
  packageName: z.string().min(1, 'Pilih paket layanan'),
  packagePrice: z.number().min(0, 'Harga harus lebih dari 0'),
  discount: z.number().min(0).default(0),
  status: z.enum(['active']),
  paymentTarget: z.enum(['Wasa', 'Kantor']),
});

type ReactivateCustomerFormData = z.infer<typeof reactivateCustomerSchema>;

interface ReactivateCustomerFormProps {
  customer: Customer;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ReactivateCustomerForm({ customer, onSuccess, trigger }: ReactivateCustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);

  const form = useForm<ReactivateCustomerFormData>({
    resolver: zodResolver(reactivateCustomerSchema),
    defaultValues: {
      packageName: customer.packageName || '',
      packagePrice: customer.packagePrice || 0,
      discount: customer.discountAmount || 0,
      status: 'active', // Always activate
      paymentTarget: customer.paymentTarget || 'Wasa',
    },
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await services.package.getActive();
      if (response.success && response.data) {
        setPackages(response.data);
      } else {
        console.error('Failed to fetch packages:', response.error);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    }
  };

  const onSubmit = async (data: ReactivateCustomerFormData) => {
    setLoading(true);
    try {
      // Find selected package to get packageId
      const selectedPackage = packages.find(pkg => pkg.name === data.packageName);

      const customerData = {
        packageName: data.packageName,
        packageId: selectedPackage?.id || customer.packageId,
        packagePrice: data.packagePrice,
        discountAmount: data.discount,
        status: data.status,
        paymentTarget: data.paymentTarget,
      };

      const response = await services.customer.update(customer.id!, customerData);

      if (response.success) {
        setOpen(false);
        form.reset();
        onSuccess?.();
      } else {
        console.error('Failed to reactivate customer:', response.error);
      }
    } catch (error) {
      console.error('Error reactivating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageChange = (packageName: string) => {
    const selectedPackage = packages.find(pkg => pkg.name === packageName);
    if (selectedPackage) {
      form.setValue('packagePrice', selectedPackage.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button style={{
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            borderColor: '#3D4558'
          }}>
            <Edit className="mr-2 h-4 w-4" style={{ color: '#FFFFFF' }} />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#FFFFFF' }}>
            Aktifkan Kembali Pelanggan
          </DialogTitle>
          <DialogDescription style={{ color: '#FFFFFF' }}>
            Edit informasi pelanggan untuk mengaktifkannya kembali.
            Nama pelanggan tidak dapat diubah.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Display Only */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                Nama Pelanggan
              </label>
              <div
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: '#2D3548',
                  color: '#FFFFFF',
                  borderColor: '#3D4558',
                  borderStyle: 'solid',
                  borderWidth: '1px'
                }}
              >
                {customer.name}
              </div>
            </div>

            <FormField
              control={form.control}
              name="packageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Paket Layanan</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handlePackageChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}>
                        <SelectValue placeholder="Pilih paket layanan" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.name} style={{ color: '#FFFFFF' }}>
                          {pkg.name} - {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(pkg.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packagePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Harga Paket</FormLabel>
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
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Diskon (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Status Pembayaran</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}>
                        <SelectValue placeholder="Pilih status pembayaran" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      <SelectItem value="active" style={{ color: '#FFFFFF' }}>Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Tujuan Pembayaran</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}>
                        <SelectValue placeholder="Pilih tujuan pembayaran" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      <SelectItem value="Wasa" style={{ color: '#FFFFFF' }}>Wasa</SelectItem>
                      <SelectItem value="Kantor" style={{ color: '#FFFFFF' }}>Kantor</SelectItem>
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
                {loading ? 'Menyimpan...' : 'Aktifkan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}