# Denycode Task Manager — Next.js Fullstack Architecture

**Based on:** PRD Denycode Task Manager v2.0  
**Application:** Fullstack Web App + PWA  
**Architecture style:** Feature/Domain-Oriented + Layered Architecture  
**Framework:** Next.js App Router + TypeScript

---

## 1. Tujuan Arsitektur

Arsitektur ini dirancang khusus untuk **Denycode Task Manager**, bukan generic Next.js project.

Target utama:

- Mudah dikembangkan dari MVP sampai fase 4.
- Memisahkan routing/UI dari business logic.
- Memisahkan business logic dari database access.
- Meminimalkan coupling antar-domain.
- Cocok untuk Next.js App Router dan Server Components.
- Mendukung Server Actions untuk mutation.
- Mendukung Route Handlers untuk public API dan upload.
- Tetap sederhana untuk aplikasi single-user.
- Tidak over-engineering dengan Clean Architecture penuh.
- Siap berkembang jika aplikasi nantinya membutuhkan domain atau integrasi baru.

PRD menetapkan aplikasi sebagai single-user, PWA, menggunakan Next.js App Router + TypeScript, PostgreSQL/Neon, Drizzle ORM, Zod, TanStack Query, Zustand, ImageKit, custom JWT, Tiptap, dnd-kit, dan FullCalendar.

---

# 2. Architectural Principles

## 2.1 Separation of Responsibilities

Gunakan alur:

```text
App Router
    ↓
Feature / UI
    ↓
Server Action / Route Handler
    ↓
Service / Business Logic
    ↓
Repository / Data Access
    ↓
Drizzle ORM
    ↓
PostgreSQL / Neon
```

Untuk read operation yang sederhana, Server Component boleh mengambil data melalui service secara langsung.

Untuk mutation:

```text
Form / Client Component
    ↓
Server Action
    ↓
Validation
    ↓
Authorization
    ↓
Service
    ↓
Repository
    ↓
Database
```

---

## 2.2 App Directory Bukan Tempat Business Logic

`src/app` bertanggung jawab terhadap:

- routing
- layout
- loading state
- error boundary
- metadata
- page composition
- route handlers

Business logic ditempatkan di `src/features`.

Contoh yang benar:

```text
src/app/(dashboard)/notes/page.tsx
    ↓
src/features/notes/services/note.service.ts
```

Bukan:

```text
src/app/(dashboard)/notes/page.tsx
    ├── database query
    ├── validation
    ├── authorization
    ├── encryption
    └── business rules
```

---

# 3. Recommended Folder Structure

```text
denycode-task-manager/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── (public)/
│   │   │   └── notes/
│   │   │       └── public/
│   │   │           └── [slug]/
│   │   │               └── page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   │
│   │   │   ├── page.tsx
│   │   │   │
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── kanban/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [boardId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── checklists/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── folders/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── public/
│   │   │   │   └── notes/
│   │   │   │       └── [slug]/
│   │   │   │           └── route.ts
│   │   │   │
│   │   │   └── upload/
│   │   │       └── imagekit/
│   │   │           └── route.ts
│   │   │
│   │   ├── offline/
│   │   │   └── page.tsx
│   │   │
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── actions/
│   │   │   │   ├── login.action.ts
│   │   │   │   └── logout.action.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── login.schema.ts
│   │   │   ├── components/
│   │   │   │   └── login-form.tsx
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── folders/
│   │   │   ├── actions/
│   │   │   ├── services/
│   │   │   │   └── folder.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── folder.repository.ts
│   │   │   ├── schemas/
│   │   │   ├── components/
│   │   │   ├── types/
│   │   │   └── constants/
│   │   │
│   │   ├── notes/
│   │   │   ├── actions/
│   │   │   │   ├── create-note.action.ts
│   │   │   │   ├── update-note.action.ts
│   │   │   │   ├── delete-note.action.ts
│   │   │   │   ├── lock-note.action.ts
│   │   │   │   ├── unlock-note.action.ts
│   │   │   │   ├── verify-note-password.action.ts
│   │   │   │   ├── set-note-public.action.ts
│   │   │   │   └── reset-note-password.action.ts
│   │   │   ├── services/
│   │   │   │   ├── note.service.ts
│   │   │   │   ├── note-lock.service.ts
│   │   │   │   └── note-share.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── note.repository.ts
│   │   │   │   ├── note-lock.repository.ts
│   │   │   │   └── note-share.repository.ts
│   │   │   ├── schemas/
│   │   │   │   ├── note.schema.ts
│   │   │   │   ├── note-lock.schema.ts
│   │   │   │   └── note-share.schema.ts
│   │   │   ├── components/
│   │   │   │   ├── note-list.tsx
│   │   │   │   ├── note-editor.tsx
│   │   │   │   ├── note-lock-dialog.tsx
│   │   │   │   ├── note-share-dialog.tsx
│   │   │   │   └── note-status.tsx
│   │   │   ├── encryption/
│   │   │   │   └── note-encryption.service.ts
│   │   │   ├── types/
│   │   │   └── constants/
│   │   │
│   │   ├── kanban/
│   │   │   ├── actions/
│   │   │   │   ├── create-board.action.ts
│   │   │   │   ├── update-board.action.ts
│   │   │   │   ├── delete-board.action.ts
│   │   │   │   ├── create-column.action.ts
│   │   │   │   ├── update-column.action.ts
│   │   │   │   ├── delete-column.action.ts
│   │   │   │   ├── create-card.action.ts
│   │   │   │   ├── update-card.action.ts
│   │   │   │   ├── delete-card.action.ts
│   │   │   │   └── reorder.action.ts
│   │   │   ├── services/
│   │   │   │   ├── board.service.ts
│   │   │   │   ├── column.service.ts
│   │   │   │   ├── card.service.ts
│   │   │   │   └── reorder.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── board.repository.ts
│   │   │   │   ├── column.repository.ts
│   │   │   │   ├── card.repository.ts
│   │   │   │   └── attachment.repository.ts
│   │   │   ├── schemas/
│   │   │   ├── components/
│   │   │   │   ├── board.tsx
│   │   │   │   ├── column.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── card-detail.tsx
│   │   │   │   └── attachment-list.tsx
│   │   │   ├── types/
│   │   │   └── constants/
│   │   │
│   │   ├── checklists/
│   │   │   ├── actions/
│   │   │   ├── services/
│   │   │   │   ├── checklist.service.ts
│   │   │   │   └── checklist-item.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── checklist.repository.ts
│   │   │   │   └── checklist-item.repository.ts
│   │   │   ├── schemas/
│   │   │   ├── components/
│   │   │   │   ├── checklist.tsx
│   │   │   │   └── checklist-item.tsx
│   │   │   └── types/
│   │   │
│   │   ├── timeline/
│   │   │   ├── actions/
│   │   │   ├── services/
│   │   │   │   └── timeline.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── timeline.repository.ts
│   │   │   ├── schemas/
│   │   │   ├── components/
│   │   │   │   └── timeline-event-form.tsx
│   │   │   └── types/
│   │   │
│   │   ├── calendar/
│   │   │   ├── services/
│   │   │   │   └── calendar.service.ts
│   │   │   ├── components/
│   │   │   │   ├── calendar.tsx
│   │   │   │   └── calendar-event.tsx
│   │   │   └── types/
│   │   │
│   │   ├── deadlines/
│   │   │   ├── services/
│   │   │   │   └── deadline.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── deadline.repository.ts
│   │   │   ├── components/
│   │   │   │   ├── upcoming-deadlines.tsx
│   │   │   │   └── deadline-badge.tsx
│   │   │   └── types/
│   │   │
│   │   └── search/
│   │       ├── actions/
│   │       │   └── global-search.action.ts
│   │       ├── services/
│   │       │   └── search.service.ts
│   │       ├── repositories/
│   │       │   └── search.repository.ts
│   │       ├── components/
│   │       │   └── global-search.tsx
│   │       └── types/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── mobile-fab.tsx
│   │   ├── feedback/
│   │   │   ├── loading-state.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-state.tsx
│   │   │   └── toast.tsx
│   │   └── pwa/
│   │       ├── install-prompt.tsx
│   │       └── connection-status.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   ├── schema/
│   │   │   │   ├── folders.ts
│   │   │   │   ├── notes.ts
│   │   │   │   ├── note-locks.ts
│   │   │   │   ├── note-shares.ts
│   │   │   │   ├── kanban-boards.ts
│   │   │   │   ├── kanban-columns.ts
│   │   │   │   ├── kanban-cards.ts
│   │   │   │   ├── kanban-attachments.ts
│   │   │   │   ├── checklists.ts
│   │   │   │   ├── checklist-items.ts
│   │   │   │   └── timeline-events.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── jwt.ts
│   │   │   ├── session.ts
│   │   │   ├── password.ts
│   │   │   └── rate-limit.ts
│   │   │
│   │   ├── encryption/
│   │   │   ├── aes-gcm.ts
│   │   │   ├── envelope.ts
│   │   │   └── key.ts
│   │   │
│   │   ├── imagekit/
│   │   │   ├── client.ts
│   │   │   ├── upload.ts
│   │   │   └── delete.ts
│   │   │
│   │   ├── cache/
│   │   │   └── query-client.ts
│   │   │
│   │   ├── pwa/
│   │   │   └── config.ts
│   │   │
│   │   ├── logger/
│   │   │   └── index.ts
│   │   │
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   ├── auth-error.ts
│   │   │   ├── validation-error.ts
│   │   │   ├── forbidden-error.ts
│   │   │   └── not-found-error.ts
│   │   │
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── file.ts
│   │       ├── string.ts
│   │       └── slug.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── app.ts
│   │   ├── routes.ts
│   │   └── permissions.ts
│   │
│   └── types/
│       ├── api.ts
│       ├── common.ts
│       └── database.ts
│
├── drizzle/
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable.png
│   └── ...
│
├── .env
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── package.json
└── README.md
```

---

# 4. Domain Mapping Berdasarkan PRD

PRD memiliki domain utama berikut:

| Domain | Tanggung Jawab |
|---|---|
| `auth` | Login, logout, JWT, session, rate limit |
| `folders` | Folder lintas tipe |
| `notes` | CRUD note, editor, lock, encryption, public share |
| `kanban` | Board, column, card, reorder, attachment |
| `checklists` | Checklist dan checklist item |
| `deadlines` | Agregasi deadline H-1/terlambat |
| `timeline` | Event kalender manual |
| `calendar` | Penyajian event gabungan |
| `search` | Global search |
| `pwa` | Install prompt, connection status, offline behavior |
| `imagekit` | Upload/delete file |
| `encryption` | AES-256-GCM + envelope encryption |

---

# 5. Kenapa `deadlines` Dipisahkan dari `kanban` dan `checklists`

PRD membutuhkan satu widget:

```text
Akan Jatuh Tempo
```

yang menggabungkan:

```text
kanban_cards
+
checklist_items
```

Jangan menaruh logic ini di:

```text
features/kanban
```

atau:

```text
features/checklists
```

karena deadline adalah cross-domain concern.

Gunakan:

```text
features/deadlines/
└── services/
    └── deadline.service.ts
```

Flow:

```text
Dashboard
    ↓
DeadlineService
    ├── KanbanRepository
    └── ChecklistRepository
    ↓
Combined Deadline DTO
    ↓
UpcomingDeadlines component
```

Dengan demikian dashboard tidak perlu mengetahui detail database dari kedua domain.

---

# 6. Calendar Architecture

Kalender penuh masuk fase 3 berdasarkan PRD.

Struktur yang disiapkan:

```text
features/calendar/
├── services/
│   └── calendar.service.ts
├── components/
│   ├── calendar.tsx
│   └── calendar-event.tsx
└── types/
```

Calendar service bertanggung jawab menggabungkan:

```text
Kanban Card Deadline
        +
Checklist Item Deadline
        +
Timeline Event
```

menjadi model:

```ts
type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: "kanban" | "checklist" | "timeline";
  color: string;
  sourceId: string;
};
```

Dengan abstraction ini FullCalendar tidak perlu mengetahui struktur database.

---

# 7. Notes Architecture

Notes adalah domain paling kompleks karena memiliki:

- Tiptap
- auto-save
- rich text
- lock
- AES-256-GCM
- envelope encryption
- public share
- public password
- search restriction
- ImageKit

Karena itu jangan membuat satu `note.service.ts` yang terlalu besar.

Gunakan:

```text
features/notes/
├── services/
│   ├── note.service.ts
│   ├── note-lock.service.ts
│   └── note-share.service.ts
│
├── encryption/
│   └── note-encryption.service.ts
│
├── repositories/
│   ├── note.repository.ts
│   ├── note-lock.repository.ts
│   └── note-share.repository.ts
```

Dependency:

```text
NoteService
   │
   ├── NoteRepository
   │
   ├── NoteLockService
   │       ↓
   │   EncryptionService
   │
   └── NoteShareService
           ↓
       NoteShareRepository
```

---

# 8. Note Encryption Boundary

Encryption **harus server-only**.

Jangan import:

```text
src/lib/encryption/*
```

ke Client Component.

Aturan:

```text
Client
  X
  │
  │ jangan akses encryption
  │
  ▼
Server Action
  ↓
NoteLockService
  ↓
EncryptionService
  ↓
Node.js crypto
```

Master key:

```env
NOTE_MASTER_ENCRYPTION_KEY=<base64 32-byte key>
```

tidak boleh pernah dikirim ke browser.

---

# 9. Kanban Architecture

Kanban membutuhkan transaksi karena reorder.

Struktur:

```text
features/kanban/
├── actions/
├── services/
│   ├── board.service.ts
│   ├── column.service.ts
│   ├── card.service.ts
│   └── reorder.service.ts
└── repositories/
```

Untuk reorder:

```text
Client
  ↓
reorder.action.ts
  ↓
reorder.service.ts
  ↓
DB Transaction
  ├── update old positions
  ├── update new positions
  └── commit
```

Constraint database:

```sql
UNIQUE (column_id, position)
DEFERRABLE INITIALLY DEFERRED
```

harus tetap dipertahankan sesuai PRD.

---

# 10. Attachment Upload Architecture

Attachment dibatasi maksimal 5MB.

Flow:

```text
Client
  ↓
Upload Route Handler
  ↓
Validate file size
  ↓
Validate file type
  ↓
ImageKit
  ↓
Save attachment metadata
  ↓
PostgreSQL
```

Jangan:

```text
Client
  ↓
ImageKit langsung
```

untuk flow yang membutuhkan validasi server sesuai requirement PRD.

Server harus memvalidasi:

```text
file.size <= 5MB
```

sebelum meneruskan upload.

Database juga mempertahankan:

```sql
CHECK (
  file_size > 0
  AND file_size <= 5242880
)
```

sebagai second line of defense.

---

# 11. Server Actions vs Route Handlers

## Server Actions

Gunakan untuk mutation internal:

```text
login
logout

folder CRUD

note CRUD
lock/unlock
set-public
reset-password

kanban CRUD
reorder

checklist CRUD

timeline CRUD

globalSearch
```

Contoh:

```text
features/notes/actions/create-note.action.ts
```

---

## Route Handlers

Gunakan untuk endpoint yang memang membutuhkan HTTP boundary:

```text
/api/public/notes/[slug]
/api/upload/imagekit
```

Sesuai PRD:

```text
Public Note
    → Route Handler

ImageKit Upload
    → Route Handler
```

---

# 12. Authentication Architecture

PRD menggunakan custom JWT dengan `jose`.

Struktur:

```text
features/auth/
├── actions/
│   ├── login.action.ts
│   └── logout.action.ts
├── services/
│   └── auth.service.ts
└── schemas/
    └── login.schema.ts

lib/auth/
├── jwt.ts
├── session.ts
├── password.ts
└── rate-limit.ts
```

Flow login:

```text
/login
   ↓
LoginForm
   ↓
login.action.ts
   ↓
auth.service.ts
   ↓
APP_PASSWORD verification
   ↓
JWT creation
   ↓
httpOnly cookie
```

Cookie:

```text
httpOnly
secure
sameSite=lax
7 days
sliding session
```

Rate limit:

```text
5 failed attempts / 5 minutes
```

---

# 13. Middleware / Request Protection

Gunakan middleware/proxy hanya untuk pekerjaan yang memang cocok di request boundary:

```text
Protected route detection
Authentication cookie presence
Redirect unauthenticated user
```

Jangan menaruh seluruh authorization/business logic di middleware.

Business authorization tetap harus diperiksa pada Server Action atau service.

Prinsip:

```text
Middleware
    ↓
Fast request-level protection

Service
    ↓
Actual authorization/business rule
```

---

# 14. PWA Architecture

PRD mewajibkan full PWA dengan `@serwist/next`.

Struktur tambahan:

```text
src/
├── app/
│   └── offline/
│       └── page.tsx
│
├── components/
│   └── pwa/
│       ├── install-prompt.tsx
│       └── connection-status.tsx
│
└── lib/
    └── pwa/
        └── config.ts
```

PWA behavior:

```text
Static assets
    → cache-first

Application data
    → network-first

Navigation failure
    → /offline
```

Jangan menggunakan cache-first untuk data aplikasi yang sering berubah karena dapat menyebabkan user melihat data stale.

---

# 15. TanStack Query

TanStack Query digunakan untuk client/server state yang memang membutuhkan client-side cache atau synchronization.

Jangan otomatis menggunakan TanStack Query untuk semua data.

Gunakan Server Component untuk data yang dapat dirender langsung dari server.

Gunakan TanStack Query ketika membutuhkan:

- client-side refetch
- polling
- optimistic update
- mutation state
- cache synchronization
- interactive data fetching

Contoh:

```text
Dashboard initial data
    → Server Component

Kanban drag/drop state
    → Client Component + TanStack Query

Global interactive search
    → TanStack Query jika diperlukan
```

---

# 16. Zustand

Zustand digunakan hanya untuk **UI/global client state**.

Contoh state yang cocok:

```text
sidebar open/close
mobile navigation
active dialog
selected card
command palette
theme/UI preferences
install prompt visibility
```

Jangan menjadikan Zustand sebagai source of truth database.

Hindari:

```text
Database
    ↓
Zustand
    ↓
semua aplikasi
```

Source of truth tetap PostgreSQL.

---

# 17. Component Boundary

Gunakan aturan:

```text
Server Component
    ↓
Client Component hanya di interactive boundary
```

Contoh dashboard:

```text
DashboardPage                 Server
│
├── UpcomingDeadlines         Server
│
├── FolderSummary             Server
│
└── QuickCreate               Client
    └── React Hook Form
```

Contoh kanban:

```text
KanbanPage                    Server
│
└── KanbanBoard                Client
    ├── KanbanColumn
    ├── KanbanCard
    └── Drag & Drop
```

Karena dnd-kit membutuhkan interactivity, boundary Client Component cukup berada pada board/interactive subtree.

---

# 18. Tiptap Boundary

Tiptap editor harus berada di Client Component.

```text
features/notes/components/
└── note-editor.tsx
```

Flow:

```text
Server Note Page
    ↓
NoteEditor Client Component
    ↓
React Hook Form
    ↓
Debounced Save
    ↓
Server Action
```

Auto-save:

```text
User types
    ↓
Debounce ~1 second
    ↓
updateNoteAction()
    ↓
Server validation
    ↓
NoteService
    ↓
Repository
```

UI state:

```text
Menyimpan...
Tersimpan
Gagal menyimpan
```

---

# 19. Folder Domain

Folder adalah cross-feature grouping.

Entity yang dapat mempunyai `folder_id`:

```text
notes
kanban_boards
checklists
```

Folder deletion:

```text
DELETE folder
    ↓
ON DELETE SET NULL
    ↓
Content remains
    ↓
Items become "Tanpa Folder"
```

Jangan implement cascade delete untuk folder.

---

# 20. Search Architecture

Search adalah cross-domain feature.

```text
features/search/
├── actions/
│   └── global-search.action.ts
├── services/
│   └── search.service.ts
├── repositories/
│   └── search.repository.ts
└── components/
    └── global-search.tsx
```

Search target:

```text
Folder name
Note title
Note plaintext content
Board title
Checklist title
```

Locked note:

```text
Search title
    ✓

Search encrypted content
    ✗
```

Database search menggunakan `search_vector` dan PostgreSQL GIN index sesuai PRD.

---

# 21. Deadline Architecture

Widget H-1 harus menjadi reusable domain service.

```text
features/deadlines/
├── services/
│   └── deadline.service.ts
├── components/
│   ├── upcoming-deadlines.tsx
│   └── deadline-badge.tsx
└── types/
```

Status:

```text
OVERDUE
TODAY
TOMORROW
NONE
```

Recommended type:

```ts
type DeadlineStatus =
  | "overdue"
  | "today"
  | "tomorrow"
  | "none";
```

Source:

```text
Kanban Card
Checklist Item
```

Output:

```ts
type UpcomingDeadline = {
  id: string;
  sourceId: string;
  source: "kanban" | "checklist";
  title: string;
  deadline: Date;
  status: DeadlineStatus;
};
```

---

# 22. Shared Components

`src/components` hanya berisi component yang benar-benar reusable.

Contoh:

```text
components/
├── ui/
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── ...
│
├── layout/
│   ├── sidebar.tsx
│   ├── bottom-nav.tsx
│   ├── topbar.tsx
│   └── mobile-fab.tsx
│
├── feedback/
│   ├── loading-state.tsx
│   ├── empty-state.tsx
│   ├── error-state.tsx
│   └── toast.tsx
│
└── pwa/
    ├── install-prompt.tsx
    └── connection-status.tsx
```

Feature-specific component tetap berada di feature.

---

# 23. Dependency Rules

Gunakan aturan berikut.

```text
app
 ↓
features
 ↓
lib
```

`components` boleh digunakan oleh:

```text
app
features
```

Tetapi:

```text
lib
```

tidak boleh import UI component.

---

## Forbidden Dependencies

Hindari:

```text
lib → features
lib → components

features/notes → features/kanban
features/kanban → features/notes
```

Jika dua domain membutuhkan logic bersama:

```text
features
    ↓
shared abstraction
```

atau pindahkan logic tersebut ke `lib` jika memang bersifat infrastructure/general-purpose.

---

# 24. Data Flow Standard

## Read

```text
Page / Server Component
        ↓
Service
        ↓
Repository
        ↓
Drizzle
        ↓
Neon PostgreSQL
```

## Mutation

```text
Client Form
    ↓
Server Action
    ↓
Zod
    ↓
Auth
    ↓
Service
    ↓
Repository
    ↓
Drizzle
    ↓
PostgreSQL
    ↓
Revalidation / Query Invalidation
```

## Public Note

```text
Browser
    ↓
/api/public/notes/[slug]
    ↓
Route Handler
    ↓
Public Note Service
    ↓
Note Share Repository
    ↓
Note Repository
    ↓
PostgreSQL
```

## Upload

```text
Browser
    ↓
/api/upload/imagekit
    ↓
Validate 5MB
    ↓
ImageKit
    ↓
Save metadata
    ↓
PostgreSQL
```

---

# 25. Database Architecture

Database schema mengikuti PRD:

```text
folders

notes
├── note_locks
└── note_shares

kanban_boards
└── kanban_columns
    └── kanban_cards
        └── kanban_card_attachments

checklists
└── checklist_items

timeline_events
```

Drizzle schema:

```text
src/lib/db/schema/
├── folders.ts
├── notes.ts
├── note-locks.ts
├── note-shares.ts
├── kanban-boards.ts
├── kanban-columns.ts
├── kanban-cards.ts
├── kanban-attachments.ts
├── checklists.ts
├── checklist-items.ts
└── timeline-events.ts
```

Migration:

```text
drizzle/
└── migrations/
```

Jangan mencampur migration dengan application source code.

---

# 26. Repository Design

Repository hanya menangani data access.

Contoh:

```ts
export const noteRepository = {
  findById(id: string) {
    // Drizzle query
  },

  findByFolderId(folderId: string) {
    // Drizzle query
  },

  create(data: CreateNoteData) {
    // Drizzle insert
  },

  update(id: string, data: UpdateNoteData) {
    // Drizzle update
  },

  delete(id: string) {
    // Drizzle delete
  },
};
```

Repository tidak boleh menangani:

```text
authorization
business rule
HTTP response
toast
redirect
UI
```

---

# 27. Service Design

Service menangani business rules.

Contoh:

```ts
export async function createNote(input: CreateNoteInput) {
  validateNoteInput(input);

  const note = await noteRepository.create(input);

  return note;
}
```

Untuk lock:

```text
NoteLockService
├── verify password
├── generate DEK
├── encrypt content
├── wrap DEK
└── persist encrypted data
```

Service tidak boleh mengetahui detail UI.

---

# 28. Action Design

Server Action adalah adapter antara UI dan service.

Contoh struktur:

```ts
"use server";

export async function createNoteAction(input: unknown) {
  const parsed = createNoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Data tidak valid.",
    };
  }

  await requireAuth();

  const note = await noteService.createNote(parsed.data);

  return {
    success: true,
    data: note,
  };
}
```

Server Action sebaiknya tipis.

Jangan membuat:

```text
create-note.action.ts
```

menjadi file 500 baris.

---

# 29. Error Handling Strategy

Gunakan typed application errors:

```text
lib/errors/
├── app-error.ts
├── auth-error.ts
├── validation-error.ts
├── forbidden-error.ts
└── not-found-error.ts
```

Contoh:

```ts
export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan.") {
    super(message, "NOT_FOUND");
  }
}
```

Mapping:

```text
ValidationError → 400 / validation response
Unauthorized → 401
Forbidden → 403
NotFound → 404
Unexpected → 500
```

UI harus menampilkan pesan berbahasa Indonesia sesuai PRD.

---

# 30. Environment Configuration

Gunakan centralized env validation:

```text
src/config/env.ts
```

Contoh:

```env
APP_PASSWORD=
JWT_SECRET=
NOTE_MASTER_ENCRYPTION_KEY=

DATABASE_URL=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

MAX_FILE_SIZE_BYTES=5242880
```

Jangan melakukan:

```ts
process.env.DATABASE_URL
```

di seluruh aplikasi.

Gunakan:

```ts
import { env } from "@/config/env";

env.DATABASE_URL;
```

---

# 31. Testing Strategy

## Unit Test

Prioritas:

```text
services
business rules
encryption
deadline calculation
validation
utilities
```

Contoh:

```text
tests/unit/features/deadlines/
tests/unit/features/notes/
tests/unit/lib/encryption/
```

## Integration Test

Prioritas:

```text
repository
database query
transaction
authentication
```

## E2E

Prioritas:

```text
login
create note
edit note
create board
drag card
create checklist
deadline H-1
public note
lock/unlock note
PWA critical flow
```

---

# 32. Testing Folder yang Lebih Terorganisir

Gunakan feature-oriented tests jika project mulai besar:

```text
tests/
├── unit/
│   ├── features/
│   │   ├── notes/
│   │   ├── kanban/
│   │   ├── checklists/
│   │   └── deadlines/
│   └── lib/
│
├── integration/
│   ├── database/
│   ├── auth/
│   └── repositories/
│
└── e2e/
    ├── auth/
    ├── notes/
    ├── kanban/
    ├── checklists/
    └── calendar/
```

---

# 33. Phase-Based Development Architecture

## Phase 1

Implement:

```text
auth
pwa
folders
notes CRUD
kanban
checklists
deadlines
responsive layout
feedback states
ImageKit attachments
```

Notes lock/encryption belum wajib diaktifkan di fase ini.

Tetapi struktur `notes/encryption` tetap boleh disiapkan agar fase 2 tidak membutuhkan refactor besar.

---

## Phase 2

Aktifkan:

```text
notes/encryption
notes lock
notes unlock
reset note password
public note share
```

---

## Phase 3

Aktifkan:

```text
calendar
timeline
calendar aggregation
FullCalendar
```

---

## Phase 4

Polish:

```text
accessibility
performance
micro-interactions
PWA audit
Lighthouse
UI refinement
```

---

# 34. Recommended Route Structure

```text
/
├── /login
│
├── /dashboard
│
├── /notes
│   ├── /new
│   └── /[id]
│
├── /kanban
│   └── /[boardId]
│
├── /checklists
│   └── /[id]
│
├── /calendar
│
├── /folders
│
├── /notes/public/[slug]
│
└── /offline
```

Public route:

```text
/notes/public/[slug]
```

tidak membutuhkan dashboard layout.

---

# 35. Dashboard Composition

Dashboard sebaiknya menjadi composition layer:

```text
DashboardPage
│
├── Header
│
├── Quick Actions
│
├── UpcomingDeadlines
│
├── RecentNotes
│
├── ActiveBoards
│
└── ActiveChecklists
```

Dashboard tidak melakukan query database langsung.

Contoh:

```text
DashboardPage
    ↓
DashboardService
    ├── DeadlineService
    ├── NoteService
    ├── KanbanService
    └── ChecklistService
```

Jika dashboard mulai kompleks, buat:

```text
features/dashboard/
```

tetapi jangan membuatnya terlalu awal jika hanya composition sederhana.

---

# 36. API / Server Action Naming Convention

Gunakan suffix eksplisit:

```text
create-note.action.ts
update-note.action.ts
delete-note.action.ts
```

Service:

```text
note.service.ts
```

Repository:

```text
note.repository.ts
```

Schema:

```text
note.schema.ts
```

Component:

```text
note-editor.tsx
```

Utility:

```text
date.ts
```

Tujuannya supaya developer dapat langsung mengetahui role sebuah file dari namanya.

---

# 37. Import Alias

Gunakan:

```ts
@/*
```

Contoh:

```ts
import { db } from "@/lib/db";
import { noteService } from "@/features/notes/services/note.service";
import { Button } from "@/components/ui/button";
```

Hindari relative import panjang:

```ts
../../../../../../features/notes/...
```

---

# 38. Rules untuk Developer

Tambahkan aturan berikut ke `README.md` atau `CONTRIBUTING.md`:

### Rule 1

Business logic tidak boleh berada di `page.tsx`.

### Rule 2

Database query tidak boleh berada di Client Component.

### Rule 3

Repository tidak boleh mengandung UI logic.

### Rule 4

Server-only module tidak boleh di-import oleh Client Component.

### Rule 5

Validation wajib dilakukan di server.

### Rule 6

Authorization wajib dilakukan di server.

### Rule 7

Zustand bukan source of truth database.

### Rule 8

Feature-specific component harus berada di feature.

### Rule 9

Shared component hanya untuk component yang benar-benar reusable.

### Rule 10

Jangan menambah abstraction sebelum ada kebutuhan nyata.

---

# 39. Trade-off Architecture

## Kelebihan

### Feature-oriented

Domain mudah ditemukan:

```text
features/notes
features/kanban
features/checklists
```

### Service + Repository

Business logic terisolasi dari database.

### Server Components

Mengurangi kebutuhan client-side JavaScript untuk halaman yang tidak interaktif.

### Server Actions

Mutation internal lebih sederhana dibanding membuat API endpoint untuk setiap CRUD.

### PWA-ready

Struktur sudah menyediakan boundary untuk:

```text
service worker
offline page
install prompt
connection status
```

### Future-proof

Fase 2 dan 3 dapat ditambahkan tanpa merombak struktur fase 1.

---

## Kekurangan

Architecture ini lebih kompleks dibanding:

```text
app/
components/
lib/
```

Untuk aplikasi yang sangat kecil, repository/service layer dapat terasa berlebihan.

Ada lebih banyak file:

```text
action
service
repository
schema
component
```

Tetapi untuk Denycode Task Manager, kompleksitas ini masih masuk akal karena domain sudah mencakup:

```text
notes
encryption
sharing
kanban
checklist
calendar
search
PWA
ImageKit
authentication
```

---

# 40. Hal yang Tidak Perlu Dilakukan

Jangan langsung menggunakan:

```text
microservices
event-driven architecture
CQRS
Kafka
RabbitMQ
DDD penuh
separate backend service
GraphQL
```

untuk versi PRD saat ini.

Aplikasi:

```text
single-user
self-hosted
Next.js
Neon
Vercel
```

belum membutuhkan kompleksitas tersebut.

Monolithic modular architecture adalah pilihan yang lebih tepat.

---

# 41. Target Architecture

Arsitektur final yang direkomendasikan:

```text
                         Browser / PWA
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          Server Components            Client Components
                 │                           │
                 │                     TanStack Query
                 │                     Zustand
                 │                     Tiptap
                 │                     dnd-kit
                 │                     FullCalendar
                 │                           │
                 └─────────────┬─────────────┘
                               │
                    App Router / Actions
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       Server Actions                    Route Handlers
              │                                 │
              └────────────────┬────────────────┘
                               │
                        Feature Services
                               │
       ┌──────────┬────────────┼────────────┬───────────┐
       │          │            │            │           │
      Auth      Notes       Kanban     Checklists   Deadlines
       │          │            │            │           │
       │          │            │            │           │
       └──────────┴────────────┴────────────┴───────────┘
                               │
                         Repositories
                               │
                         Drizzle ORM
                               │
                  ┌────────────┴────────────┐
                  │                         │
             Neon PostgreSQL            ImageKit
```

---

# 42. Final Recommendation

Untuk Denycode Task Manager, gunakan prinsip:

```text
APP
→ routing & composition

FEATURES
→ domain & business logic

LIB
→ infrastructure & shared technical capability

COMPONENTS
→ truly reusable UI

DATABASE
→ integrity & persistence

SERVER ACTIONS
→ internal mutation boundary

ROUTE HANDLERS
→ HTTP/public/upload boundary
```

Struktur paling penting:

```text
src/
├── app/
├── features/
├── components/
├── lib/
├── config/
└── types/
```

Dan dependency utama:

```text
app
 ↓
features
 ↓
lib
```

Dengan pendekatan ini, Denycode Task Manager tetap sederhana sebagai monolith Next.js, tetapi memiliki modularitas yang cukup untuk berkembang dari **Phase 1 → Phase 4** tanpa perlu melakukan architectural rewrite besar.

---

# 43. Architecture Checklist

- [ ] App Router digunakan sebagai routing layer.
- [ ] `app/` tidak berisi business logic kompleks.
- [ ] Feature dipisahkan berdasarkan domain.
- [ ] Server Actions digunakan untuk mutation internal.
- [ ] Route Handler hanya digunakan ketika HTTP boundary memang dibutuhkan.
- [ ] Business logic berada di service.
- [ ] Database access berada di repository.
- [ ] Validation menggunakan Zod di server.
- [ ] Authentication dan authorization dilakukan di server.
- [ ] Encryption hanya berjalan di server.
- [ ] Master encryption key tidak pernah dikirim ke client.
- [ ] Attachment maksimal 5MB divalidasi di server.
- [ ] Database tetap memiliki constraint 5MB.
- [ ] Deadline logic dipisahkan sebagai cross-domain service.
- [ ] Calendar menjadi aggregation layer.
- [ ] Feature-specific component berada di feature.
- [ ] Shared UI berada di `components/ui`.
- [ ] Zustand hanya digunakan untuk client/UI state.
- [ ] TanStack Query digunakan ketika client cache/synchronization memang dibutuhkan.
- [ ] Server Component menjadi default.
- [ ] Client Component hanya digunakan pada interactive boundary.
- [ ] PWA memiliki offline fallback.
- [ ] Static assets menggunakan cache-first.
- [ ] Application data menggunakan network-first.
- [ ] Database index mengikuti access pattern.
- [ ] Query performance divalidasi dengan `EXPLAIN (ANALYZE, BUFFERS)`.
- [ ] Unit, integration, dan E2E test dipisahkan.
- [ ] Tidak menggunakan microservices/CQRS/event bus sebelum ada kebutuhan nyata.
