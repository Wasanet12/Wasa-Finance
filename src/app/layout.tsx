import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SimpleAuthProvider } from "@/components/simple-auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wasa Finance - Sistem Manajemen Keuangan Internal",
  description: "Sistem manajemen keuangan dan pelanggan internal untuk Wasa Finance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wasa Finance",
  },
  openGraph: {
    title: "Wasa Finance - Sistem Manajemen Keuangan Internal",
    description: "Sistem manajemen keuangan dan pelanggan internal untuk Wasa Finance",
    type: "website",
    locale: "id_ID",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B2336',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <SimpleAuthProvider>
            {children}
          </SimpleAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
