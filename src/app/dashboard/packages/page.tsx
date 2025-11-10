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
import { formatDate, toDate } from '@/utils/dateUtils';
import { Search, Edit, Trash2, Package as PackageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPackages();
  }, []);

  // Responsive pagination - set items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 when filtered packages change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPackages]);

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
        // Sort packages by createdAt descending (newest first)
        const sortedPackages = response.data.sort((a, b) => {
          const dateA = toDate(a.createdAt);
          const dateB = toDate(b.createdAt);
          if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
          }
          return 0;
        });
        setPackages(sortedPackages);
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

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

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden md:block rounded-lg border table-container-rounded" style={{ borderColor: '#3D4558', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <Table>
              <TableHeader className="table-header-white">
                <TableRow className="table-row-hover">
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Nama Paket</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Harga</TableHead>
                  <TableHead style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right" style={{ backgroundColor: '#FFFFFF', color: '#1B2336' }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow className="table-row-hover">
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: '#FFFFFF' }}>
                      {searchTerm
                        ? 'Tidak ada paket yang cocok dengan pencarian.'
                        : 'Belum ada data paket layanan.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((pkg) => (
                    <TableRow key={pkg.id} className="table-row-hover">
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
                              <Button variant="outline" size="sm" className="custom-btn">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="custom-btn">
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
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePackage(pkg.id!)}
                                  className="custom-btn"
                                  style={{ backgroundColor: '#EF4444' }}
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

          {/* Mobile Cards - Visible only on mobile */}
          <div className="md:hidden space-y-3">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-8 text-white">
                {searchTerm
                  ? 'Tidak ada paket yang cocok dengan pencarian.'
                  : 'Belum ada data paket layanan.'}
              </div>
            ) : (
              currentItems.map((pkg) => (
                <Card key={pkg.id} className="border-[#3D4558]" style={{ backgroundColor: '#2D3548' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg mb-1">{pkg.name}</h3>
                        <p className="text-[#FBBF24] font-bold text-lg">{formatCurrency(pkg.price)}</p>
                        <p className="text-[#A0A8B8] text-sm">{formatDate(pkg.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <PackageForm
                        pkg={pkg}
                        onSuccess={fetchPackages}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="custom-btn h-10 w-10 p-0"
                            aria-label="Edit paket"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="custom-btn h-10 w-10 p-0"
                            aria-label="Hapus paket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ backgroundColor: '#1B2336' }} className="w-11/12 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle style={{ color: '#FFFFFF' }}>Hapus Paket</AlertDialogTitle>
                            <AlertDialogDescription style={{ color: '#FFFFFF' }}>
                              Apakah Anda yakin ingin menghapus paket &quot;{pkg.name}&quot;?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePackage(pkg.id!)}
                              className="custom-btn w-full sm:w-auto"
                              style={{ backgroundColor: '#EF4444' }}
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-4 gap-2 px-4">
          <div className="text-sm text-gray-300 pagination-info">
            Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, filteredPackages.length)} dari {filteredPackages.length} paket
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="pagination-nav-btn px-3 py-1"
              size="sm"
              style={{
                backgroundColor: currentPage === 1 ? '#1B2336' : '#FFFFFF',
                color: currentPage === 1 ? '#A0A8B8' : '#1B2336',
                borderColor: currentPage === 1 ? '#1B2336' : '#FFFFFF',
                opacity: currentPage === 1 ? 0.5 : 1,
                pointerEvents: currentPage === 1 ? 'none' : 'auto'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`pagination-page-btn px-3 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'active'
                        : ''
                    }`}
                    size="sm"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="pagination-nav-btn px-3 py-1"
              size="sm"
              style={{
                backgroundColor: currentPage === totalPages ? '#1B2336' : '#FFFFFF',
                color: currentPage === totalPages ? '#A0A8B8' : '#1B2336',
                borderColor: currentPage === totalPages ? '#1B2336' : '#FFFFFF',
                opacity: currentPage === totalPages ? 0.5 : 1,
                pointerEvents: currentPage === totalPages ? 'none' : 'auto'
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}