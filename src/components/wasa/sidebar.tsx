"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  LogOut
} from 'lucide-react';
import { logout as logOut } from '@/lib/auth';
import { preloadData } from '@/hooks/useFirestoreCache';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Semua Pelanggan',
    href: '/dashboard/customers/all',
    icon: Users,
  },
  {
    name: 'Pelanggan Bayar',
    href: '/dashboard/customers/paid',
    icon: Users,
  },
  {
    name: 'Pelanggan Belum Bayar',
    href: '/dashboard/customers/unpaid',
    icon: Users,
  },
  {
    name: 'Pelanggan Off',
    href: '/dashboard/customers/off',
    icon: Users,
  },
  {
    name: 'Biaya Operasional',
    href: '/dashboard/expenses',
    icon: DollarSign,
  },
  {
    name: 'Kelola Paket',
    href: '/dashboard/packages',
    icon: Package,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  // Preload data for common routes on mount
  useEffect(() => {
    // Preload commonly accessed data
    preloadData(['customers', 'packages', 'expenses']);
  }, []);

  // Enhanced navigation with prefetching
  const enhancedNavigation = useMemo(() => navigation.map(item => ({
    ...item,
    prefetch: () => {
      // Prefetch the route
      router.prefetch(item.href);

      // Prefetch relevant data based on route
      if (item.href.includes('customers')) {
        preloadData(['customers']);
      } else if (item.href.includes('packages')) {
        preloadData(['packages']);
      } else if (item.href.includes('expenses')) {
        preloadData(['expenses']);
      } else if (item.href === '/dashboard') {
        preloadData(['customers', 'packages', 'expenses']);
      }
    }
  })), [router]);

  const handleNavigation = (href: string) => {
    setLoadingRoute(href);
    router.push(href);

    // Reset loading state after a delay
    setTimeout(() => {
      setLoadingRoute(null);
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full w-64 bg-background border-r border-border", className)}>
      <div className="flex-1 py-4 sm:py-6">
        <div className="px-4 sm:px-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/WASAA.jpg"
                alt="Wasa Finance Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover shadow-sm w-full max-w-[48px] h-auto"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                Wasa Finance
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Sistem Keuangan
              </p>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <div className="space-y-1">
            {enhancedNavigation.map((item) => {
              const isActive = pathname === item.href;
              const isLoading = loadingRoute === item.href;

              return (
                <Button
                  key={item.name}
                  className={cn(
                    "w-full justify-start h-10 sm:h-11 px-3 sm:px-4 rounded-lg transition-all duration-200 relative",
                    isActive
                      ? "bg-white text-[#1B2336] shadow-sm font-semibold"
                      : "custom-btn",
                    isLoading && "opacity-80"
                  )}
                  onClick={() => handleNavigation(item.href)}
                  onMouseEnter={() => item.prefetch()}
                  disabled={isLoading}
                >
                  <item.icon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium text-sm sm:text-base truncate">
                    {item.name}
                  </span>
                  {isLoading && (
                    <LoadingSpinner size="sm" className="ml-auto" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-4 py-3 sm:py-4 border-t border-border">
        <Button
          className="w-full justify-start h-10 sm:h-11 px-3 sm:px-4 custom-btn rounded-lg transition-all duration-200"
          onClick={handleLogout}
        >
          <div className="flex items-center">
            <LogOut className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Keluar</span>
          </div>
        </Button>
      </div>
    </div>
  );
}