"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PackageForm } from '@/components/wasa/package-form';
import { services } from '@/lib/firestore';
import { Package } from '@/lib/types';
import { formatDate } from '@/utils/dateUtils';
import { Search, Edit, Trash2, Package as PackageIcon } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    const filtered = packages.filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPackages(filtered);
  }, [packages, searchTerm]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await services.package.delete(packageId);
      if (response.success) {
        fetchPackages();
      } else {
        console.error('Failed to delete package:', response.error);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1B2336' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PackageIcon className="h-6 w-6" style={{ color: '#1B2336' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#1B2336' }}>Kelola Paket</h1>
        </div>
        <PackageForm onSuccess={fetchPackages} />
      </div>

      {/* Package Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Total Paket
            </CardTitle>
            <PackageIcon className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {packages.length}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Paket layanan tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Harga Rata-rata
            </CardTitle>
            <PackageIcon className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {packages.length > 0
                ? formatCurrency(packages.reduce((sum, pkg) => sum + pkg.price, 0) / packages.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Per paket
            </p>
          </CardContent>
        </Card>

        <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Harga Tertinggi
            </CardTitle>
            <PackageIcon className="h-4 w-4" style={{ color: '#FFFFFF' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              {packages.length > 0
                ? formatCurrency(Math.max(...packages.map(pkg => pkg.price)))
                : formatCurrency(0)}
            </div>
            <p className="text-xs" style={{ color: '#FFFFFF' }}>
              Paket premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card className="border-border" style={{ backgroundColor: '#1B2336' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between" style={{ color: '#FFFFFF' }}>
            <span>Daftar Paket Layanan</span>
            <div className="text-sm font-normal" style={{ color: '#FFFFFF' }}>
              Total: {filteredPackages.length} paket
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: '#FFFFFF' }} />
              <Input
                placeholder="Cari paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                style={{
                  backgroundColor: '#2D3548',
                  color: '#FFFFFF',
                  borderColor: '#3D4558'
                }}
              />
            </div>
          </div>

          <div className="rounded-md border" style={{ borderColor: '#3D4558' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: '#FFFFFF' }}>Nama Paket</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Harga</TableHead>
                  <TableHead style={{ color: '#FFFFFF' }}>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right" style={{ color: '#FFFFFF' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {searchTerm
                        ? 'Tidak ada paket yang cocok dengan pencarian.'
                        : 'Belum ada data paket layanan.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium" style={{ color: '#FFFFFF' }}>{pkg.name}</TableCell>
                      <TableCell className="font-semibold" style={{ color: '#FFFFFF' }}>
                        {formatCurrency(pkg.price)}
                      </TableCell>
                      <TableCell style={{ color: '#FFFFFF' }}>{formatDate(pkg.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <PackageForm
                            pkg={pkg}
                            onSuccess={fetchPackages}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent style={{ backgroundColor: '#1B2336' }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: '#FFFFFF' }}>Hapus Paket</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: '#FFFFFF' }}>
                                  Apakah Anda yakin ingin menghapus paket &quot;{pkg.name}&quot;?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel style={{
                                  backgroundColor: 'transparent',
                                  color: '#FFFFFF',
                                  borderColor: '#3D4558'
                                }}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePackage(pkg.id!)}
                                  style={{
                                    backgroundColor: '#3D4558',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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