# Anti-Nganggur 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-green.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-613%20passing-brightgreen.svg)](https://github.com/Erliandikasyahputraa/anti-nganggur)
[![Quality Gate](https://img.shields.io/badge/Quality%20Gate-100%25%20Passing-success.svg)](https://github.com/Erliandikasyahputraa/anti-nganggur)

> **Aplikasi pelacak lamaran kerja modern berbasis Kanban board & Server Actions, dirancang dengan antarmuka Glassmorphism yang elegan, performa cepat, dan keamanan multi-tenant berlapis.**

Mencari pekerjaan bisa menjadi proses yang melelahkan jika lamaran tercecer di berbagai spreadsheet dan email. **Anti-Nganggur** hadir sebagai solusi terstruktur untuk membantu job seeker mengelola, memantau progress, dan menganalisis status setiap lamaran kerja secara rapi dalam satu ruang kerja terpadu.

🌐 **[Live Demo di Vercel](https://anti-nganggur.vercel.app/)** • 📖 **[Dokumentasi Arsitektur](./docs/)** • 🐛 **[Laporkan Isu](https://github.com/Erliandikasyahputraa/anti-nganggur/issues)** • 💡 **[Request Fitur](https://github.com/Erliandikasyahputraa/anti-nganggur/issues)**

---

## 🎯 Kenapa Anti-Nganggur?

1. **Anti Lupa & Rapi**: Semua lamaran kerja, mulai dari _Applied_, _Screening_, _Interview_, _Technical Test_, _Offer_, hingga _Rejected_ terorganisir rapi dalam papan Kanban interaktif.
2. **Performa Tinggi (Zero Waterfall)**: Dioptimasi secara mendalam untuk menghilangkan bottleneck latency. Data fetching terkonsolidasi hanya dalam 1 round-trip query.
3. **Keamanan Multi-Tenant Berlapis**: Data setiap pengguna terisolasi total menggunakan PostgreSQL Row Level Security (RLS) di database Supabase dan validasi scoped `user_id` di application layer.
4. **Desain Modern macOS Glassmorphism**: Pengalaman visual yang menyenangkan, responsif di mobile & desktop, serta mendukung Dark Mode otomatis.
5. **Open Source & Bebas Iklan**: 100% open-source di bawah lisensi MIT. Anda bebas menggunakan versi cloud atau melakukan self-hosting sendiri.

---

## ✨ Fitur Utama

- 📋 **Papan Kanban Interaktif**: Drag-and-drop kartu lamaran dengan transisi animasi halus menggunakan `@dnd-kit`.
- 🔍 **Pencarian & Multi-Filter Real-Time**: Cari berdasarkan nama perusahaan, posisi, status, atau rentang tanggal dengan URL sync state yang presisi.
- 🏢 **Manajemen Detail Perusahaan**: Catat detail kontak recruiter, lokasi kantor, ekspektasi gaji, hingga link lowongan.
- 📝 **Catatan & Histori Status**: Lacak lini masa perubahan status setiap lamaran secara kronologis.
- ⚡ **Aksi Massal (Bulk Actions)**: Update status banyak lamaran sekaligus atau hapus batch secara aman.
- 📊 **Ekspor Data**: Download rekap seluruh lamaran kerja ke format CSV dalam satu klik.
- 🌓 **Tema Gelap & Terang**: Dukungan Dark Mode dan Light Mode terintegrasi dengan preferensi sistem operasi.

---

## 🛠 Tech Stack

| Layer                 | Teknologi                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Framework**         | [Next.js 15 (App Router)](https://nextjs.org/) & React 18                                               |
| **Bahasa**            | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode, 0 any types)                              |
| **Styling & UI**      | [Tailwind CSS 4](https://tailwindcss.com/), Radix UI, Lucide Icons                                      |
| **State & Drag-Drop** | [@dnd-kit](https://dndkit.com/), React Hook Form, Zod                                                   |
| **Backend & DB**      | [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Auth SSR)                         |
| **Testing**           | [Vitest](https://vitest.dev/), Testing Library, Playwright (40 test suites, 613 unit/integration tests) |
| **Package Manager**   | [Bun](https://bun.sh/) & Node.js 22+                                                                    |

---

## 🔒 Keamanan & Multi-Tenant Isolation

Anti-Nganggur menerapkan prinsip **Defense-in-Depth** untuk isolasi data pengguna:

1. **Database Row Level Security (PostgreSQL RLS)**:
   - Tabel `applications`, `companies`, `application_history`, dan `documents` dilindungi RLS policies.
   - Akses `anon` publik dicabut secara default.
   - Setiap operasi SQL `SELECT`, `INSERT`, `UPDATE`, `DELETE` diverifikasi langsung oleh database engine: `auth.uid() = user_id`.
2. **Server-Side Authorization**:
   - Server Actions dan API layer memvalidasi JWT user terautentikasi melalui Supabase Auth (`getUser()`).
   - Query data secara eksplisit difilter dengan `.eq('user_id', authenticatedUserId)`.
3. **Session & Cookie Security**:
   - Token otentikasi disimpan dalam cookie `httpOnly`, `secure`, dan `sameSite: lax`.

---

## 🚀 Memulai (Local Development)

### Prasyarat

- [Node.js](https://nodejs.org/) v20+ atau [Bun](https://bun.sh/)
- Akun [Supabase](https://supabase.com/) (Tersedia tier gratis)

### 1. Clone Repositori

```bash
git clone https://github.com/Erliandikasyahputraa/anti-nganggur.git
cd anti-nganggur
```

### 2. Instal Dependensi

```bash
bun install
# atau menggunakan npm:
# npm install
```

### 3. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel kredensial Supabase Anda di `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 4. Jalankan Migrasi Database

Jalankan skrip migrasi SQL yang berada di direktori `supabase/migrations/` pada SQL Editor Supabase Anda, atau gunakan Supabase CLI:

```bash
supabase db push
```

### 5. Jalankan Development Server

```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Pengujian & Quality Gates

Kualitas kode dijamin melalui 5 lapis pengujian otomatis:

```bash
# 1. Typecheck TypeScript
bun run typecheck

# 2. Linting & Code Style
bun run lint

# 3. Unit & Integration Tests (613 tests)
bun run test

# 4. Build Validation Script
./scripts/validate-build.sh

# 5. Production Next.js Build
bunx next build
```

---

## 📖 Kisah Pengembangan & Optimasi

Anti-Nganggur melalui perjalanan optimasi performa dan keamanan yang mendalam:

- **Pemberantasan Auth Waterfall**: Mengeliminasi 7x redundant Supabase Auth round-trips yang sebelumnya menyebabkan waktu loading 30 detik pada server actions, memangkas latency menjadi instan (<500ms) dengan mengkonsolidasikan autentikasi dalam 1 query context.
- **Penguatan Multi-Tenant**: Mengisolasi penuh tabel data lamaran dengan mengaktifkan PostgreSQL Row Level Security (Migration 007) dan dual-check di layer API server.

---

## 🗺 Roadmap Masa Depan

- [x] Papan Kanban & CRUD Lamaran Kerja
- [x] Multi-tenant Data Isolation & PostgreSQL RLS
- [x] Optimasi Latency Server Actions
- [x] Ekspor CSV & Bulk Status Mutation
- [ ] **Focus Workspace View**: Mode fokus harian untuk mempersiapkan interview berikutnya
- [ ] **Email Reminder & Notification**: Pengingat jadwal wawancara terintegrasi kalender
- [ ] **AI Resume & Job Matcher**: Saran kustomisasi resume berdasarkan deskripsi pekerjaan

---

## 🤝 Kontribusi

Kontribusi selalu disambut dengan hangat! Jika Anda ingin menambahkan fitur atau memperbaiki bug:

1. Fork repositori ini.
2. Buat branch fitur baru (`git checkout -b feature/fitur-keren`).
3. Commit perubahan Anda (`git commit -m 'feat: tambah fitur keren'`).
4. Pastikan semua tes lolos (`bun run test`).
5. Push ke branch Anda (`git push origin feature/fitur-keren`).
6. Buka **Pull Request**.

Silakan baca panduan lengkap di [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](./LICENSE) — silakan gunakan, pelajari, dan kembangkan secara bebas.
