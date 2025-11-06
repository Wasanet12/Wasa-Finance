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
import { Package as PackageType } from '@/lib/types';
import { services } from '@/lib/firestore';
import { Plus } from 'lucide-react';

const packageSchema = z.object({
  name: z.string().min(1, 'Nama paket wajib diisi'),
  price: z.number().min(0, 'Harga harus lebih dari 0'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Durasi harus lebih dari 0'),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormProps {
  pkg?: PackageType;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function PackageForm({ pkg, onSuccess, trigger }: PackageFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: pkg?.name || '',
      price: pkg?.price || 0,
      description: pkg?.description || '',
      duration: pkg?.duration || 1,
      features: pkg?.features || [],
      isActive: pkg?.isActive ?? true,
    },
  });

  const onSubmit = async (data: PackageFormData) => {
    setLoading(true);
    try {
      const packageData = {
        ...data,
        features: data.features || [],
      };

      if (pkg?.id) {
        const updateResult = await services.package.update(pkg.id, packageData);
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update package');
        }
      } else {
        const addResult = await services.package.create(packageData);
        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to create package');
        }
      }
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving package:', error);
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
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base custom-btn"
            style={{
              minHeight: '44px', // Touch-friendly size
            }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Tambah Paket</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#1B2336' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#FFFFFF' }}>
            {pkg ? 'Edit Paket' : 'Tambah Paket Baru'}
          </DialogTitle>
          <DialogDescription style={{ color: '#FFFFFF' }}>
            {pkg
              ? 'Edit informasi paket layanan yang sudah ada.'
              : 'Tambahkan paket layanan baru ke dalam sistem.'
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
                  <FormLabel style={{ color: '#FFFFFF' }}>Nama Paket</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Paket Basic, Paket Premium"
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga (IDR)</FormLabel>
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
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFFFF' }}>Durasi (bulan)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(1);
                        } else {
                          const parsedValue = parseInt(value);
                          field.onChange(isNaN(parsedValue) ? 1 : parsedValue);
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

  
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="custom-btn"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="custom-btn"
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