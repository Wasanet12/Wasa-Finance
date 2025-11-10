# Progressive Web App (PWA)

## Apa Itu PWA?

Progressive Web App (PWA) adalah aplikasi web yang menggunakan fitur-fitur modern untuk memberikan pengalaman pengguna yang mirip dengan aplikasi asli (native app) melalui browser web. PWA menggabungkan keunggulan web dan aplikasi mobile dalam satu solusi yang dapat diakses dari berbagai perangkat.

### Keunggulan PWA:

- **Progressive**: Bekerja untuk setiap pengguna, terlepas dari peramban pilihan mereka
- **Responsif**: Cocok dengan berbagai ukuran layar (desktop, mobile, tablet)
- **Offline**: Dapat berfungsi tanpa koneksi internet berkat service worker
- **Instalatif**: Bisa ditambahkan ke layar utama perangkat
- **Pembaharuan otomatis**: Selalu versi terbaru tanpa perlu instalasi manual
- **Keamanan**: Menggunakan HTTPS untuk perlindungan data
- **Berbagi mudah**: Dapat dibagikan melalui URL tanpa instalasi

## Persiapan Implementasi PWA di Website Ini

### 1. File Manifest (`manifest.json`)
File yang berisi informasi tentang aplikasi seperti nama, ikon, tema, dan konfigurasi tampilan.

### 2. Service Worker
File JavaScript yang berjalan di latar belakang dan mengelola cache serta permintaan jaringan untuk mendukung fungsionalitas offline.

### 3. Ikon Aplikasi
Berbagai versi ukuran ikon yang dibutuhkan untuk tampilan di berbagai perangkat (192x192, 512x512, dll).

### 4. HTTPS
PWA harus diakses melalui koneksi aman (HTTPS).

## Rancangan Implementasi PWA

### Struktur File yang Dibutuhkan

```
public/
├── manifest.json
├── icons/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── ... (ukuran lainnya)
└── sw.js (service worker)
```

### 1. File `manifest.json`

```json
{
  "name": "Nama Aplikasi Anda",
  "short_name": "Singkatan",
  "description": "Deskripsi aplikasi Anda",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Register Service Worker

Tambahkan skrip untuk meregistrasi service worker di halaman utama:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

### 3. File Service Worker (`sw.js`)

```javascript
const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

### 4. Link Manifest di HTML

Tambahkan tag berikut di bagian `<head>` dokumen HTML:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
```

## Implementasi di Next.js

Karena website ini menggunakan Next.js, berikut beberapa pendekatan yang bisa digunakan:

### 1. Menggunakan `next-pwa` Package

Install package:
```bash
npm install next-pwa
```

Konfigurasi di `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Konfigurasi Next.js lainnya
});
```

### 2. Konfigurasi Manual

Pastikan file manifest dan service worker ditempatkan di direktori `public` dan terhubung dengan benar ke aplikasi.

## Testing PWA

Gunakan Chrome DevTools untuk memeriksa implementasi PWA:
1. Buka tab Application
2. Periksa bagian Manifest untuk melihat apakah file manifest terdeteksi
3. Periksa bagian Service Workers untuk melihat status worker
4. Gunakan Lighthouse untuk audit PWA

## Checklist Implementasi

- [ ] File manifest.json dibuat dan terhubung dengan benar
- [ ] Ikon-ikon aplikasi disediakan dalam berbagai ukuran
- [ ] Service worker terdaftar dan berfungsi
- [ ] Fitur offline diimplementasikan
- [ ] Website berjalan di HTTPS
- [ ] Pengujian PWA dilakukan dengan alat pengujian
- [ ] Fungsi instalasi ditest di berbagai perangkat