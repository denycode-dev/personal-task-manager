# PRD: Denycode Task Manager
**Versi:** 2.0
**Tipe Produk:** Fullstack web app + PWA, single-user, self-hosted (deploy via Vercel)
**Disusun sebagai:** Product Requirement Document teknis untuk pengembangan

---

## 1. Ringkasan Produk

**Denycode Task Manager** — aplikasi personal untuk mencatat (notes), mengelola tugas (kanban board & checklist), dan melihat linimasa deadline (calendar timeline) dalam satu tempat. Diakses oleh satu pemilik (single-user) melalui satu password global, dapat di-install sebagai PWA (Progressive Web App) di desktop maupun mobile, dioptimalkan untuk kecepatan input dan kenyamanan penggunaan.

**Prinsip utama produk:**
- Cepat dipakai, minim friksi (buka app → langsung kerja)
- Mobile-first, tapi tetap maksimal di desktop
- Bisa di-install seperti aplikasi native (PWA)
- Semua feedback ke user (error/sukses/loading/kosong) jelas dan berbahasa Indonesia yang baik
- User selalu tahu deadline yang mendesak (H-1) tanpa harus mencari-cari
- Data terpusat dalam 1 kalender global untuk semua deadline

---

## 2. Keputusan Final (Hasil Klarifikasi)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Nama aplikasi | **Denycode Task Manager** |
| 2 | Model autentikasi | Single-user, tanpa tabel `users`. Password global di `.env` (`APP_PASSWORD`). |
| 3 | Enkripsi note terkunci | AES-256-GCM dengan **envelope encryption** (lihat Bagian 5) — bukan E2E murni, agar reset password tetap bisa memulihkan konten. |
| 4 | Cakupan ImageKit | Gambar dalam rich text notes + attachment file di kanban card. |
| 5 | Batas ukuran file | **Maksimal 5MB untuk semua jenis file** (gambar note maupun attachment kanban), ditegakkan di server & database. |
| 6 | Public share note | Read-only, tanpa expiry. |
| 7 | Struktur folder | Flat, 1 level (tidak ada subfolder). |
| 8 | Durasi sesi login | Sliding session, auto-logout setelah 7 hari tidak aktif. |
| 9 | Reminder deadline | **Tidak ada push notification.** Cukup **indikator visual** di dalam aplikasi untuk item dengan deadline ≤ 1 hari (H-1) — badge, warna, dan widget ringkasan. |
| 10 | Export/backup data | **Tidak diperlukan** di v1. |
| 11 | PWA | **Wajib, full PWA** — installable, app shell caching, offline fallback. |
| 12 | Cakupan fase 1 | PWA, indikator visual H-1, batas file 5MB, dan seluruh fitur inti (notes, kanban, checklist, folder) masuk fase 1. Lock/enkripsi & public share tetap di fase 2, kalender global penuh di fase 3 — lihat catatan di Bagian 12. |

---

## 3. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Sesuai template yang sudah disiapkan |
| PWA | `@serwist/next` | Generate service worker + manifest otomatis dari config Next.js |
| Styling & UI Components | Tailwind CSS + shadcn/ui + **neobrutalism.com components** | Registry berbasis shadcn/ui |
| Rich Text Editor | Tiptap | |
| Drag & Drop (Kanban) | dnd-kit | |
| Kalender | FullCalendar (community edition) | |
| Database | PostgreSQL via **Neon** (serverless) | |
| ORM | Drizzle ORM + `drizzle-kit` | Driver: `@neondatabase/serverless` |
| Autentikasi | Custom JWT (`jose`) di cookie `httpOnly` | |
| Enkripsi note | Node.js `crypto` bawaan — AES-256-GCM, envelope encryption | |
| Validasi | Zod | |
| Form handling | React Hook Form + `@hookform/resolvers/zod` | |
| Server state | TanStack Query | |
| UI/global state | Zustand | |
| File/image storage | ImageKit (`imagekitio-next` SDK) | Validasi 5MB dilakukan di server sebelum upload diteruskan |
| Deployment | Vercel | |
| Hosting DB | Neon (free tier) | |

---

## 4. Arsitektur Aplikasi

```
┌───────────────────────────────────────────────────┐
│            Client (Browser / Installed PWA)         │
│  Next.js App Router (RSC + Client Components)        │
│  Service Worker (app shell cache + offline fallback)  │
│  - Sidebar (desktop) / Bottom Nav (mobile)             │
│  - Widget "Akan Jatuh Tempo" (H-1 indicator)            │
│  - TanStack Query cache                                  │
└───────────────┬───────────────────────────────────┘
                │ Server Actions / Route Handlers
┌───────────────▼───────────────────────────────────┐
│                Next.js Server (Vercel)                │
│  - Auth middleware (cek cookie JWT)                     │
│  - Server Actions (mutasi data)                          │
│  - Route Handlers /api/public/* (akses publik)             │
│  - Validasi ukuran file (≤5MB) sebelum upload                │
│  - Enkripsi/dekripsi AES (envelope encryption) di server       │
└───────┬─────────────────────────┬─────────────────┘
        │ Drizzle ORM              │ ImageKit SDK
┌───────▼───────────┐     ┌────────▼──────────┐
│   Neon PostgreSQL   │     │   ImageKit CDN     │
└─────────────────────┘     └─────────────────────┘
```

**PWA — komponen yang ditambahkan:**
- `manifest.json`: nama "Denycode Task Manager", short_name "Denycode", icon 192x192 & 512x512 (maskable), `display: standalone`, `theme_color` & `background_color` sesuai palet neobrutalism.
- Service worker: strategi **cache-first** untuk app shell/aset statis, **network-first** untuk data (karena data berubah sering — hindari data basi ditampilkan sebagai "terbaru").
- Halaman fallback offline: `/offline` — ditampilkan otomatis saat request navigasi gagal karena tidak ada koneksi, dengan pesan: *"Anda sedang offline. Beberapa fitur mungkin tidak tersedia."*
- Custom "Install App" prompt: tangkap event `beforeinstallprompt` (Chrome/Edge/Android), tampilkan tombol install kontekstual. Untuk iOS Safari (tidak mendukung event ini), tampilkan instruksi manual: *"Tap ikon Bagikan, lalu pilih 'Tambah ke Layar Utama'."*

---

## 5. Skema Database (ERD)

Desain database ini mengikuti prinsip: **Normalize first → Enforce integrity → Design berdasarkan query → Index berdasarkan workload → Measure with EXPLAIN → Scale only when necessary.**

### 5.1 Prinsip Normalisasi yang Diterapkan

Semua tabel berada di **3NF** (setiap atribut non-key bergantung penuh dan langsung pada primary key, tidak ada dependensi transitif). Di atas 3NF, saya melakukan **vertical decomposition** untuk dua klaster atribut yang sifatnya opsional/kondisional, alih-alih menaruhnya sebagai kolom nullable di tabel utama:

- **`note_locks`** dipisah dari `notes` — kolom seperti `password_hash`, `content_ciphertext`, kunci enkripsi hanya relevan **jika** note dikunci. Menaruhnya sebagai kolom nullable di `notes` akan membuat state "terkunci" bisa **tidak konsisten** (misal `is_locked = true` tapi `password_hash = NULL`). Dengan tabel terpisah, keberadaan baris di `note_locks` **adalah** definisi "note ini terkunci" — tidak ada boolean flag yang bisa desync dari data sebenarnya.
- **`note_shares`** dipisah dari `notes` — dengan alasan yang sama untuk status "publik". Keberadaan baris = note ini publik. `public_slug` juga natural jadi UNIQUE tanpa perlu constraint kondisional.

Ini bukan sekadar normalisasi teoritis — ini **integrity by construction**: kondisi ilegal (misal "publik tapi tidak punya slug") menjadi *mustahil direpresentasikan*, bukan cuma dicegah lewat validasi aplikasi.

> **Koreksi dari draft sebelumnya:** pada draft v1, saya sempat menulis bahwa menghapus folder akan **menghapus** semua notes/kanban/checklist di dalamnya. Ini tidak konsisten dengan desain `ON DELETE SET NULL` yang lebih aman. Saya perbaiki di sini: **menghapus folder tidak menghapus isinya** — item di dalamnya hanya menjadi "tanpa folder". Ini lebih sesuai prinsip *correctness* (mencegah kehilangan data tidak sengaja) dan akan saya refleksikan juga di copy UI konfirmasi.

### 5.2 DDL Lengkap

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FOLDERS
-- ============================================================
CREATE TABLE folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7)  NOT NULL DEFAULT '#FFD500',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_folders_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT chk_folders_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================
-- NOTES (atribut inti — selalu ada untuk setiap note)
-- ============================================================
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   UUID REFERENCES folders(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL DEFAULT 'Catatan tanpa judul',

  -- Plaintext content. NULL ketika note terkunci (konten pindah ke note_locks).
  content     JSONB,

  -- Full-text search: otomatis HANYA mengindeks title + content plaintext.
  -- Saat terkunci, content = NULL -> search_vector otomatis cuma mengindeks title.
  -- Ini menyelesaikan requirement "isi note terkunci tidak bisa dicari" tanpa logic tambahan.
  search_vector TSVECTOR GENERATED ALWAYS AS (
                  to_tsvector('indonesian', coalesce(title,'') || ' ' || coalesce(content::text,''))
                ) STORED,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_notes_title_not_empty CHECK (length(trim(title)) > 0)
);

-- ============================================================
-- NOTE_LOCKS (1:1 opsional — HANYA ada baris jika note terkunci)
-- Envelope encryption: password note = gate akses (bcrypt),
-- konten dienkripsi pakai DEK acak per-note, DEK dibungkus (wrap)
-- oleh Master Key (.env) — sehingga reset password TIDAK PERNAH
-- kehilangan akses ke konten, karena password tidak pernah jadi
-- satu-satunya sumber kunci dekripsi.
-- ============================================================
CREATE TABLE note_locks (
  note_id             UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  password_hash       TEXT NOT NULL,   -- bcrypt hash, murni untuk gate akses baca

  content_ciphertext  TEXT NOT NULL,
  content_iv          TEXT NOT NULL,
  content_auth_tag    TEXT NOT NULL,

  dek_wrapped         TEXT NOT NULL,   -- Data Encryption Key, terenkripsi oleh Master Key
  dek_wrap_iv         TEXT NOT NULL,
  dek_wrap_auth_tag   TEXT NOT NULL,

  locked_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTE_SHARES (1:1 opsional — HANYA ada baris jika note publik)
-- ============================================================
CREATE TABLE note_shares (
  note_id       UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  public_slug   VARCHAR(16) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_note_shares_slug_format CHECK (public_slug ~ '^[A-Za-z0-9_-]{8,16}$')
);

-- ============================================================
-- KANBAN BOARDS
-- ============================================================
CREATE TABLE kanban_boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   UUID REFERENCES folders(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL DEFAULT 'Papan tanpa judul',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_kanban_boards_title_not_empty CHECK (length(trim(title)) > 0)
);

-- ============================================================
-- KANBAN COLUMNS
-- ============================================================
CREATE TABLE kanban_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,   -- seed default: 'Tugas','Dalam Progress','Selesai'
  color       VARCHAR(7),
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_kanban_columns_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT chk_kanban_columns_color_hex CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT uq_kanban_columns_board_position UNIQUE (board_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- KANBAN CARDS
-- ============================================================
CREATE TABLE kanban_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  deadline    TIMESTAMPTZ,
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_kanban_cards_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT uq_kanban_cards_column_position UNIQUE (column_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- KANBAN CARD ATTACHMENTS
-- Business rule "maks 5MB" DITEGAKKAN DI DATABASE, bukan cuma di UI.
-- ============================================================
CREATE TABLE kanban_card_attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id           UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  file_url          TEXT NOT NULL,
  imagekit_file_id  TEXT NOT NULL,
  file_name         VARCHAR(255) NOT NULL,
  file_type         VARCHAR(100),
  file_size         INTEGER NOT NULL,   -- bytes
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_attachments_file_size CHECK (file_size > 0 AND file_size <= 5242880) -- 5MB
);

-- ============================================================
-- CHECKLISTS
-- ============================================================
CREATE TABLE checklists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   UUID REFERENCES folders(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL DEFAULT 'Checklist tanpa judul',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_checklists_title_not_empty CHECK (length(trim(title)) > 0)
);

-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================
CREATE TABLE checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  content       VARCHAR(500) NOT NULL,
  is_done       BOOLEAN NOT NULL DEFAULT false,
  deadline      TIMESTAMPTZ,
  position      INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_checklist_items_content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT uq_checklist_items_checklist_position UNIQUE (checklist_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- TIMELINE EVENTS (entri kalender manual, bebas dari task/kanban)
-- ============================================================
CREATE TABLE timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  color       VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_timeline_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_timeline_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chk_timeline_end_after_start CHECK (end_at IS NULL OR end_at >= start_at)
);
```

**Catatan constraint `UNIQUE (..., position) DEFERRABLE INITIALLY DEFERRED`:** dipakai pada tabel yang butuh reorder (drag & drop). Tanpa `DEFERRABLE`, proses "geser 5 card sekaligus" akan gagal karena constraint dicek per-statement (bentrok posisi sementara di tengah transaksi). Dengan `DEFERRABLE INITIALLY DEFERRED`, pengecekan constraint ditunda sampai akhir transaksi — reorder tetap atomik dan tetap **menegakkan integritas** (tidak boleh ada 2 card dengan posisi sama di kolom yang sama, di akhir transaksi).

### 5.3 Access Pattern → Index (Index Berdasarkan Workload)

Setiap index di bawah **dipasangkan dengan query nyata yang melayaninya** — bukan index spekulatif. Karena aplikasi belum live, ini adalah *index kandidat* berbasis pola akses yang sudah diketahui dari spesifikasi fitur. Setelah live, setiap index wajib divalidasi dengan `EXPLAIN (ANALYZE, BUFFERS)`, dan index yang tidak pernah terpakai (dicek via `pg_stat_user_indexes`) harus di-drop — sesuai prinsip *"jangan mengoptimalkan berdasarkan asumsi"*.

| # | Query / Access Pattern | Index | Alasan |
|---|---|---|---|
| 1 | Tampilkan notes dalam folder X, urut terbaru | `CREATE INDEX idx_notes_folder_updated ON notes(folder_id, updated_at DESC);` | Query paling sering dijalankan (buka folder). Composite index melayani filter + sort sekaligus. Berlaku juga untuk `folder_id IS NULL` ("Tanpa Folder"). |
| 2 | Pencarian teks global pada notes | `CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);` | Wajib untuk full-text search performa baik; sequential scan pada `to_tsvector` per-row tidak layak begitu jumlah note bertambah. |
| 3 | Resolusi note publik via slug (`/notes/public/[slug]`) | Otomatis dari `UNIQUE` constraint di `note_shares.public_slug` | Postgres otomatis membuat index untuk constraint UNIQUE — tidak perlu index manual tambahan. |
| 4 | Cek status lock / ambil metadata enkripsi saat buka note | Otomatis dari `PRIMARY KEY note_id` di `note_locks` | PK lookup, tidak butuh index tambahan. |
| 5 | Tampilkan board dengan kolom urut posisi | `CREATE INDEX idx_kanban_columns_board_pos ON kanban_columns(board_id, position);` | Query utama saat membuka 1 board. |
| 6 | Tampilkan card dalam 1 kolom urut posisi | `CREATE INDEX idx_kanban_cards_column_pos ON kanban_cards(column_id, position);` | Query utama render kanban board. |
| 7 | Ambil attachment milik 1 card | `CREATE INDEX idx_attachments_card ON kanban_card_attachments(card_id);` | **Penting:** Postgres TIDAK otomatis mengindeks kolom FK (beda dengan sisi yang direferensikan). Tanpa index ini, `ON DELETE CASCADE` dan join ke attachment akan sequential scan. |
| 8 | Tampilkan item checklist urut posisi | `CREATE INDEX idx_checklist_items_checklist_pos ON checklist_items(checklist_id, position);` | Query utama render checklist. |
| 9 | Widget "Akan Jatuh Tempo" (H-1) — kanban | `CREATE INDEX idx_kanban_cards_deadline ON kanban_cards(deadline) WHERE deadline IS NOT NULL;` | Partial index — kebanyakan card mungkin tidak punya deadline, index penuh akan boros. Melayani filter `deadline BETWEEN now() AND now() + interval '1 day'`. |
| 10 | Widget "Akan Jatuh Tempo" (H-1) — checklist | `CREATE INDEX idx_checklist_items_deadline ON checklist_items(deadline) WHERE deadline IS NOT NULL;` | Sama seperti #9, untuk checklist item. |
| 11 | Kalender global — ambil event pada rentang tanggal | `CREATE INDEX idx_timeline_events_start ON timeline_events(start_at);` | Melayani filter rentang bulan/minggu di FullCalendar. **Catatan:** jika ke depan banyak event multi-hari yang overlap kompleks, index B-tree biasa pada `start_at` saja mulai kurang optimal — solusi (GiST range index) baru dipertimbangkan **jika** terbukti lambat lewat `EXPLAIN`, bukan dari awal. |
| — | Daftar folder di sidebar | **Tidak ada index tambahan.** | Untuk single-user, jumlah folder secara realistis puluhan, bukan jutaan — sequential scan pada PK sudah cukup cepat. Menambah index di sini melanggar prinsip *"jangan scale sebelum bottleneck terbukti"*. |

### 5.4 Ringkasan Penegakan Integritas (Enforce Integrity)

| Aturan Bisnis | Ditegakkan Sebagai |
|---|---|
| Judul folder/note/board/checklist/timeline tidak boleh kosong | `CHECK (length(trim(...)) > 0)` |
| Warna harus format hex valid | `CHECK (color ~ '^#[0-9A-Fa-f]{6}$')` |
| File attachment maksimal 5MB | `CHECK (file_size <= 5242880)` di `kanban_card_attachments` + validasi ukuran di server sebelum upload ke ImageKit (untuk gambar note yang tidak melewati tabel terstruktur) |
| Status "terkunci" tidak bisa desync dari data enkripsi | Struktur tabel `note_locks` (1:1 opsional) — bukan boolean flag |
| Status "publik" tidak bisa desync dari slug | Struktur tabel `note_shares` (1:1 opsional) |
| Slug publik selalu unik | `UNIQUE` constraint pada `note_shares.public_slug` |
| Dua card/kolom/item tidak boleh punya posisi sama dalam parent yang sama | `UNIQUE (parent_id, position) DEFERRABLE` |
| Tanggal selesai timeline tidak boleh sebelum tanggal mulai | `CHECK (end_at IS NULL OR end_at >= start_at)` |
| Menghapus folder tidak menghapus isinya (hanya ungroup) | `ON DELETE SET NULL` pada `folder_id` |
| Menghapus board/checklist ikut menghapus semua kolom/card/item di dalamnya | `ON DELETE CASCADE` (karena tanpa board/checklist induk, data tersebut tidak punya makna berdiri sendiri) |

---

## 6. Autentikasi & Keamanan

### 6.1 Login
1. `/login` → input password → dibandingkan dengan `APP_PASSWORD` di server.
2. Jika cocok → JWT disimpan di cookie `httpOnly`, `secure`, `sameSite=lax`, masa berlaku 7 hari, **sliding** (diperpanjang tiap aktivitas).
3. Salah password → *"Password salah. Silakan coba lagi."*
4. Rate limit: 5 percobaan gagal / 5 menit → *"Terlalu banyak percobaan. Coba lagi dalam X menit."*

### 6.2 Enkripsi Note Terkunci (Envelope Encryption)

**Saat mengunci note:**
1. Generate **DEK** (Data Encryption Key) acak, 256-bit.
2. Enkripsi `content` dengan DEK (AES-256-GCM) → `content_ciphertext`, `content_iv`, `content_auth_tag`.
3. "Bungkus" (wrap) DEK dengan **Master Key** (dari `.env`, terpisah dari `APP_PASSWORD`) → `dek_wrapped`, `dek_wrap_iv`, `dek_wrap_auth_tag`.
4. Simpan `bcrypt(password_note)` sebagai `password_hash` — murni untuk gate verifikasi akses baca, **tidak terlibat dalam proses dekripsi**.
5. Baris baru dibuat di `note_locks`; `notes.content` di-null-kan.

**Saat membuka note terkunci:** verifikasi `password_hash` → jika cocok, server unwrap DEK pakai Master Key → dekripsi `content_ciphertext` → kirim plaintext ke client (tidak disimpan permanen di client).

**Saat reset password (lupa password note, via password aplikasi):** karena DEK dibungkus oleh Master Key (bukan oleh password note), reset **hanya** meng-update `password_hash` dengan password baru — **konten dan DEK tidak perlu disentuh sama sekali**. Ini menghilangkan risiko kehilangan data yang ada di desain envelope-by-password sebelumnya.

### 6.3 Note Publik
- Baris di `note_shares` = note ini publik, diakses di `/notes/public/[public_slug]`.
- Read-only, tanpa expiry.
- Jika note juga ada di `note_locks` → halaman publik minta password note dulu sebelum konten dikirim dari server (tidak pernah ke client sebelum verifikasi).
- Kanban & checklist **tidak pernah** punya mekanisme share — tidak ada tabel/rute publik untuk keduanya.

---

## 7. Spesifikasi Fitur & User Flow

### 7.1 Indikator Deadline H-1 (Baru)

- **Badge per-item:** setiap kanban card & checklist item dengan deadline mendapat label warna:
  - 🔴 **"Terlambat"** — deadline sudah lewat & belum selesai
  - 🟠 **"Hari ini"** — deadline dalam 24 jam ke depan yang jatuh hari ini
  - 🟡 **"Besok"** — deadline H-1 (24-48 jam ke depan)
  - Tanpa badge jika deadline masih jauh
- **Widget global "Akan Jatuh Tempo":** ditampilkan di halaman utama/dashboard, berisi daftar gabungan (kanban card + checklist item) dengan deadline ≤ 1 hari, diurutkan dari yang paling mendesak. Query ini menggunakan partial index `idx_kanban_cards_deadline` & `idx_checklist_items_deadline` (lihat 5.3).
- **Badge count** di ikon notifikasi/bell pada top bar (desktop) atau bottom nav (mobile) menunjukkan jumlah item H-1/terlambat — murni visual, tanpa push notification.

### 7.2 Notes
*(tidak berubah dari draft sebelumnya — lihat Bagian 6 untuk detail enkripsi terbaru)*
- Rich text editor Tiptap: bold, italic, underline, strikethrough, bullet/numbered list, tabel, special character, heading, blockquote, code block.
- Auto-save debounce ±1 detik, indikator "Menyimpan..." → "Tersimpan".
- Lock note → modal set password → badge gembok di list, preview isi disembunyikan total.
- Share note → toggle publik → generate URL, salin link.
- Lupa password note → via password aplikasi (hanya dari dashboard, tidak dari halaman publik).

### 7.3 Kanban Board
- Board baru → 3 kolom default: **Tugas**, **Dalam Progress**, **Selesai**.
- Kolom dinamis: tambah/ubah nama/warna/hapus (dengan konfirmasi jika masih ada card).
- Card: quick-add, detail panel (deskripsi, deadline, attachment ≤5MB), drag & drop antar kolom & reorder.

### 7.4 Checklist
- Tambah item cepat (Enter untuk lanjut), toggle selesai, deadline per-item.

### 7.5 Folder
- Pengelompokan lintas tipe (note/kanban/checklist), warna custom, **hapus folder = ungroup isi, bukan hapus isi** (lihat koreksi di 5.1).

### 7.6 Pencarian Global
- Cari di: nama folder, judul & isi note (plaintext saja), judul board, judul checklist.
- Note terkunci: hanya judul yang bisa dicari, tanpa cuplikan isi.

### 7.7 Kalender & Timeline (Fase 3)
- View bulan/minggu/hari, gabungan deadline kanban + checklist + timeline manual, warna berbeda per kategori, tambah entri manual bebas.

---

## 8. Desain UI/UX

*(Prinsip umum tidak berubah dari draft sebelumnya: neobrutalism, mobile-first dengan bottom nav + FAB, desktop dengan sidebar persisten + side panel, sistem feedback berbahasa Indonesia EYD/PUEBI untuk semua state.)*

**Tambahan untuk PWA:**
- Banner instalasi kontekstual: *"Install Denycode Task Manager di perangkat Anda untuk akses lebih cepat."* + tombol "Install" / "Nanti saja".
- Indikator status koneksi: banner tipis di atas layar saat offline — *"Anda sedang offline. Perubahan akan tersimpan setelah online kembali."* (untuk aksi yang di-queue) atau *"Tidak dapat memuat data terbaru."* untuk halaman yang butuh data baru.
- Splash screen sesuai `theme_color`/`background_color` saat app dibuka dari home screen (native PWA behavior, dikonfigurasi lewat manifest).

**Tambahan untuk indikator H-1:**
- Warna badge (merah/oranye/kuning) harus tetap lulus kontras WCAG AA terhadap background neobrutalism yang biasanya solid & tegas.

---

## 9. API / Server Actions (Ringkasan Domain)

| Domain | Aksi | Tipe |
|---|---|---|
| Auth | `login`, `logout` | Server Action |
| Folders | CRUD folder | Server Action |
| Notes | CRUD, lock/unlock, verify-password, set-public, reset-password-note | Server Action |
| Notes (publik) | `getPublicNote(slug)`, `verifyPublicNotePassword` | Route Handler `/api/public/notes/[slug]` |
| Kanban | CRUD board/column/card, reorder, upload attachment (validasi ≤5MB) | Server Action + Route Handler upload |
| Checklist | CRUD checklist/item, toggle done, reorder | Server Action |
| Timeline/Calendar | CRUD timeline event, `getCalendarEvents(range)`, `getUpcomingDeadlines()` (H-1 widget) | Server Action |
| Search | `globalSearch(query)` | Server Action |
| Upload | `uploadToImageKit(file)` (cek ≤5MB sebelum kirim), `deleteFromImageKit(fileId)` | Route Handler |

---

## 10. Environment Variables

```env
# Auth
APP_PASSWORD=40563
JWT_SECRET=<random 32+ char string>
NOTE_MASTER_ENCRYPTION_KEY=<random 32 byte key, base64>

# Database (Neon)
DATABASE_URL=postgresql://...neon.tech/...

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# App
MAX_FILE_SIZE_BYTES=5242880
```

---

## 11. Non-Functional Requirements

- **Performa:** FCP < 1.5s di 4G; auto-save debounce; index sesuai Bagian 5.3.
- **PWA:** installable (lulus kriteria Lighthouse PWA checklist), app shell ter-cache, fallback offline berfungsi, ukuran service worker minimal.
- **Aksesibilitas:** kontras warna neobrutalism lulus WCAG AA; navigasi keyboard penuh untuk desktop.
- **Keamanan:** cookie `httpOnly`+`secure`; rate limiting login; envelope encryption (Bagian 6.2); validasi ukuran file di server (bukan hanya client) untuk mencegah bypass batas 5MB.
- **Bahasa:** seluruh UI copy berbahasa Indonesia EYD/PUEBI, konsisten (glossary internal disarankan).

---

## 12. Fase Pengembangan

**Fase 1 — Full MVP + PWA:**
Auth, PWA (manifest, service worker, install prompt, offline fallback), folder CRUD, notes CRUD (rich text, belum lock), kanban penuh (board/column/card dinamis, drag & drop, attachment ≤5MB), checklist penuh, deadline pada card & checklist item, **widget & badge H-1**, layout responsive (sidebar + bottom nav + FAB), seluruh sistem state/error berbahasa Indonesia.

**Fase 2 — Keamanan & Sharing:**
Lock/unlock note (envelope encryption), reset password note, public share note read-only.

**Fase 3 — Kalender Penuh:**
Halaman kalender global (bulan/minggu/hari), timeline event manual, integrasi visual semua sumber deadline dalam 1 tampilan.

**Fase 4 — Polish:**
Refinement animasi neobrutalism, micro-interaction, audit aksesibilitas & performa PWA (Lighthouse).

> **Catatan interpretasi:** Anda meminta "PWA, indikator H-1, batas file, dan penamaan" masuk fase 1 — sudah saya terapkan di atas. Fitur lock/enkripsi dan kalender penuh saya **tetap** di fase 2 & 3 karena secara teknis bergantung pada fondasi fase 1 dan punya kompleksitas tersendiri (envelope encryption, integrasi FullCalendar). Jika maksud Anda sebenarnya **seluruh fitur** (termasuk lock & kalender) masuk fase 1 tanpa pentahapan sama sekali, beri tahu saya dan saya sesuaikan.

---

## 13. Status Open Items

Semua open items dari draft sebelumnya sudah terjawab:
- ~~Reminder/notifikasi~~ → indikator visual H-1 (selesai didesain di Bagian 7.1)
- ~~Export/backup~~ → tidak diperlukan
- ~~Limit file~~ → 5MB, ditegakkan di database & server
- ~~Nama aplikasi~~ → Denycode Task Manager

**Belum ada open item baru.** Siap lanjut ke tahap berikutnya — misalnya breakdown ke user stories/ticket per fase, atau wireframe low-fidelity untuk halaman utama (dashboard, note editor, kanban board, checklist, kalender).
