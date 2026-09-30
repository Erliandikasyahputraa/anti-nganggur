# Anti-Nganggur — Riwayat Arsitektur & Rekayasa Perangkat Lunak 🛠️

Dokumen ini merangkum tonggak rekayasa teknis, arsitektur data, dan perjalanan optimasi performa dalam pengembangan **Anti-Nganggur**.

---

## 1. Arsitektur Inti & Desain Sistem

Anti-Nganggur dibangun dengan arsitektur modern berbasis **Next.js 15 (App Router)** dan **Supabase**:

- **Frontend & Rendering**: React Server Components (RSC) untuk efisiensi transfer data awal, dipadukan dengan Client Components interaktif untuk manipulasi drag-and-drop Kanban (`@dnd-kit`).
- **Antarmuka (UI)**: Desain kustom Glassmorphism terinspirasi macOS dengan palet token warna CSS terkontrol, fluid spring animations, dan dukungan tema terang/gelap (Dark Mode).
- **Backend & State Mutation**: Server Actions terisolasi yang memvalidasi otentikasi sesi sebelum memicu mutasi data di PostgreSQL Supabase.

---

## 2. Tonggak Optimasi Performa (Pemberantasan Auth Waterfall)

### Diagnosis Masalah Awal

Pada tahap awal, navigasi Server Actions mengalami latency 30–36 detik akibat pola _redundant round-trips_:

1. Setiap komponen dan Server Action melakukan pemanggilan `supabase.auth.getUser()` berulang kali secara serial.
2. Konkurensi refresh token memicu antrian network round-trip yang memblokir render Server Components.

### Solusi Arsitektural

- Mengkonsolidasikan autentikasi dalam 1 query context di level Server Action/Workspace page (`getWorkspaceData`).
- Mengeliminasi auth cascade tanpa mengorbankan middleware session refresh dan verifikasi RLS.
- **Hasil**: Latency server action berkurang drastis dari ~35 detik menjadi instan (<500ms).

---

## 3. Penguatan Keamanan Multi-Tenant (PostgreSQL RLS)

Untuk menjamin privasi dan isolasi data antar pengguna secara mutlak, Anti-Nganggur menerapkan prinsip **Defense-in-Depth**:

### A. Layer Database (PostgreSQL RLS)

- PostgreSQL Row Level Security diaktifkan penuh pada tabel `applications`, `companies`, `application_documents`, `application_status_history`, dan `custom_columns`.
- Hak akses `anon` (publik tak terautentikasi) dicabut secara eksplisit.
- Kebijakan SQL RLS (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) membatasi akses:
  ```sql
  CREATE POLICY "Users can manage own applications" ON applications
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```

### B. Layer Aplikasi (Server Actions & API)

- Setiap query dan mutasi data menyertakan filter eksplisit `.eq('user_id', authenticatedUserId)` yang diverifikasi dari JWT Supabase Auth.

---

## 4. Kualitas Kode & Pengujian Otomatis

Stabilitas aplikasi dijaga melalui sistem pengujian berlapis:

- **Unit & Integration Tests**: 40 file test suite dengan 613 tes menggunakan Vitest dan React Testing Library.
- **Validasi Build Otomatis**: Skrip `../scripts/validate-build.sh` memverifikasi aturan CSP, ketiadaan forbidden code patterns (`@ts-ignore`, `eslint-disable`, inappropriate `any`), serta kompilasi TypeScript ketat.

---

## 5. Rencana Pengembangan (Roadmap)

- [x] Papan Kanban & Mutasi Status Lamaran
- [x] Multi-Tenant Data Isolation (PostgreSQL RLS)
- [x] Optimasi Latency Server Actions
- [x] Ekspor CSV & Batch Actions
- [ ] **Focus Workspace View**: Mode fokus harian untuk mempersiapkan sesi wawancara mendatang
- [ ] **Reminder & Kalender**: Notifikasi jadwal interview via email dan kalender
- [ ] **AI Assistant**: Ringkasan kesesuaian profil dengan deskripsi pekerjaan
