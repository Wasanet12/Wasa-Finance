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
  discountAmount: z.number().min(0),
  status: z.enum(['active', 'inactive', 'Belum Bayar', 'pending']),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
          <Button
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base custom-btn"
            style={{
              minHeight: '44px', // Touch-friendly size
            }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Tambah Pelanggan</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-[400px] md:max-w-[425px] max-h-[85vh] sm:max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <DialogTitle className="text-base sm:text-lg font-semibold" style={{ color: '#FFFFFF' }}>
            {customer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm" style={{ color: '#FFFFFF' }}>
            {customer
              ? 'Edit informasi pelanggan.'
              : 'Tambahkan pelanggan baru.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Nama Pelanggan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama pelanggan"
                      value={field.value === 0 ? '' : field.value}
                      onChange={field.onChange}
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

  
            <FormField
              control={form.control}
              name="packageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Paket Layanan</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handlePackageChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm custom-select">
                        <SelectValue placeholder="Pilih paket" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-48 overflow-y-auto" style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.name} className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packagePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Harga Paket</FormLabel>
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
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Diskon (Rp)</FormLabel>
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
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      style={{
                        backgroundColor: '#2D3548',
                        color: '#FFFFFF',
                        borderColor: '#3D4558'
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm custom-select">
                        <SelectValue placeholder="Pilih status" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      <SelectItem value="active" className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">Aktif</SelectItem>
                      <SelectItem value="inactive" className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">Tidak Aktif</SelectItem>
                      <SelectItem value="Belum Bayar" className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">Belum Bayar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-medium" style={{ color: '#FFFFFF' }}>Bayar ke</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm custom-select">
                        <SelectValue placeholder="Pilih tujuan" style={{ color: '#FFFFFF' }} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent style={{
                      backgroundColor: '#1B2336',
                      borderColor: '#3D4558'
                    }}>
                      <SelectItem value="Wasa" className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">Wasa</SelectItem>
                      <SelectItem value="Kantor" className="text-xs sm:text-sm py-1 sm:py-2 custom-select-item">Kantor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" style={{ color: '#FFFFFF' }} />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm order-2 sm:order-1 min-h-[36px] custom-btn"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm order-1 sm:order-2 min-h-[36px] custom-btn"
                style={{
                  backgroundColor: '#10B981'
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