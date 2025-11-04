"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from '@/components/simple-auth-provider';
import { Sidebar } from '@/components/wasa/sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();

  console.log('🏠 Dashboard Layout - User:', user ? 'Logged in' : 'Not logged in');
  console.log('🏠 Dashboard Layout - Loading:', authLoading);

  // Redirect if not authenticated
  useEffect(() => {
    console.log('🏠 Dashboard useEffect - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && !user) {
      console.log('🏠 Redirecting to login...');
      router.push('/login');
    } else if (!authLoading && user) {
      console.log('🏠 User authenticated, showing dashboard');
    }
  }, [user, authLoading, router]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#1B2336' }}></div>
          <p style={{ color: '#1B2336' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: '#1B2336' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#3D4558' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>Wasa Finance</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border" style={{ backgroundColor: '#1B2336' }}>
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold" style={{ color: '#1B2336' }}>Wasa Finance</h1>
          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Page Content */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}