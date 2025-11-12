'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#1B2336] flex items-center justify-center min-h-screen">
        <div className="text-center text-white p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Ups! Terjadi Kesalahan</h2>
          <p className="mb-6">Aplikasi mengalami masalah teknis. Silakan coba beberapa saat lagi.</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-900 rounded text-left text-sm">
              <pre>{error.message}</pre>
              <pre className="mt-2">{error.stack}</pre>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}