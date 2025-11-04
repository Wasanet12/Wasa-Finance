"use client";

import { useState, useEffect } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Customer, Package } from '@/lib/types';
import { services } from '@/lib/firestore';
import { Plus } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi'),
  packageName: z.string().min(1, 'Pilih paket layanan'),
  packagePrice: z.number().min(0, 'Harga harus lebih dari 0'),
  discountAmount: z.number().min(0).default(0),
  status: z.enum(['active', 'inactive', 'pending']),
  paymentTarget: z.enum(['Wasa', 'Kantor']),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CustomerForm({ customer, onSuccess, trigger }: CustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      packageName: customer?.packageName || '',
      packagePrice: customer?.packagePrice || 0,
      discountAmount: customer?.discountAmount || 0,
      status: customer?.status || 'active',
      paymentTarget: customer?.paymentTarget || 'Wasa',
    },
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const packagesResponse = await services.package.getActive();
      if (packagesResponse.success && packagesResponse.data) {
        setPackages(packagesResponse.data);
      } else {
        console.error('Error fetching packages:', packagesResponse.error);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      // Find selected package to get package ID
      const selectedPackage = packages.find(pkg => pkg.name === data.packageName);
      if (!selectedPackage) {
        throw new Error('Paket yang dipilih tidak ditemukan');
      }

      // Calculate final price based on discount
      const finalPrice = data.packagePrice - data.discountAmount;

      const customerData = {
        name: data.name,
        packageId: selectedPackage.id,
        packageName: data.packageName,
        packagePrice: data.packagePrice,
        originalPrice: data.packagePrice,
        discountAmount: data.discountAmount,
        status: data.status,
        paymentTarget: data.paymentTarget,
        phoneNumber: '',
        email: '',
        address: '',
        notes: '',
      };

      // Only include finalPrice if there's a discount
      if (data.discountAmount > 0) {
        (customerData as any).finalPrice = finalPrice;
      }

      if (customer?.id) {
        const updateResult = await services.customer.update(customer.id, customerData);
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update customer');
        }
      } else {
        const addResult = await services.customer.create(customerData);
        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to create customer');
        }
      }
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving customer:', error);
      // Tambahkan alert untuk user
      alert(`Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data'}`);
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
            backgroundColor: '#1B2336',
            color: '#FFFFFF'
          }}>
            <Plus className="mr-2 h-4 w-4" style={{ color: '#FFFFFF' }} />
            Tambah Pelanggan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#FFFFFF' }}>
            {customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </DialogTitle>
          <DialogDescription style={{ color: '#FFFFFF' }}>
            {customer
              ? 'Edit informasi pelanggan yang sudah ada.'
              : 'Tambahkan pelanggan baru ke dalam sistem.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Nama Pelanggan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nama pelanggan"
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
              name="discountAmount"
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
                      <SelectItem value="inactive" style={{ color: '#FFFFFF' }}>Inactive</SelectItem>
                      <SelectItem value="pending" style={{ color: '#FFFFFF' }}>Pending</SelectItem>
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
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}