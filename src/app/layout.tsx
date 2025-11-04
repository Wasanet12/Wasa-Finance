import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wasa Finance - Sistem Manajemen Keuangan Internal",
  description: "Sistem manajemen keuangan dan pelanggan internal untuk Wasa Finance",
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
        {children}
      </body>
    </html>
  );
}
