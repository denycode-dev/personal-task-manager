---
name: technical-explainer
description: Menjelaskan konsep teknis dalam Bahasa Indonesia yang sederhana dan terstruktur. Gunakan ketika perlu menjelaskan rencana implementasi, keputusan arsitektur, trade-off teknis, atau konsekuensi perubahan kode agar dapat dipahami oleh developer baru sekalipun.
---

# Technical Explainer

## Tujuan

Skill ini memastikan bahwa setiap penjelasan teknis yang disampaikan AI:

1. **Ditulis dalam Bahasa Indonesia** yang sederhana dan tidak kaku
2. **Terstruktur dan mudah dipindai** — menggunakan heading, bullet point, dan tabel
3. **Menggunakan istilah teknis yang tepat** — istilah Inggris dipertahankan jika tidak ada padanan yang baik, namun selalu disertai penjelasan singkat
4. **Menjelaskan konsekuensi** dari setiap keputusan teknis, bukan hanya "apa"-nya tapi juga "kenapa" dan "apa dampaknya"

## Kapan Skill Ini Digunakan

- Saat AI menjelaskan **rencana implementasi** sebelum mulai coding
- Saat AI menjelaskan **keputusan arsitektur** (mengapa memilih pendekatan A bukan B)
- Saat AI menjelaskan **trade-off** dari suatu perubahan kode
- Saat AI memberikan ringkasan hasil pekerjaannya setelah selesai
- Saat developer baru bertanya "ini kode ngapain?" atau "kenapa harus begini?"
- Saat menjelaskan **error atau bug** yang ditemukan

---

## Struktur Penjelasan yang Wajib Diikuti

Setiap penjelasan teknis harus mengikuti format berikut. Pilih bagian yang relevan — tidak semua bagian harus ada di setiap penjelasan.

### 1. Ringkasan Singkat (1-3 kalimat)

Jawab pertanyaan: **"Kita mau ngapain?"**

Gunakan bahasa yang sangat sederhana. Bayangkan kamu menjelaskan ke teman yang baru bergabung hari ini.

> **Contoh:**
> Kita akan menambahkan fitur untuk menghapus data user dari halaman admin. AI akan membuat sebuah tombol "Hapus", dialog konfirmasi, dan koneksi ke API backend agar data benar-benar terhapus dari database.

---

### 2. Apa yang Akan Dibuat / Diubah

Jelaskan file atau komponen apa yang akan terpengaruh. Gunakan format tabel atau bullet list.

**Format yang disarankan:**

| Aksi | File / Komponen | Penjelasan Singkat |
|------|----------------|-------------------|
| Buat baru | `DeleteUserDialog.tsx` | Komponen dialog konfirmasi sebelum hapus |
| Ubah | `UserTable.tsx` | Tambahkan kolom aksi dengan tombol hapus |
| Buat baru | `useDeleteUser.ts` | Hook untuk memanggil API hapus user |

---

### 3. Cara Kerjanya (Alur / Flow)

Jelaskan urutan langkah dari sudut pandang pengguna dan sistem. Gunakan nomor urut atau diagram teks sederhana.

> **Contoh:**
> 1. Pengguna klik tombol "Hapus" di baris tabel — komponen `UserTable` menangkap aksi ini
> 2. Dialog konfirmasi muncul (`DeleteUserDialog`) — menampilkan nama user yang akan dihapus
> 3. Jika pengguna klik "Ya, Hapus", hook `useDeleteUser` dipanggil
> 4. Hook mengirim request `DELETE /api/users/{id}` ke backend
> 5. Jika berhasil, tabel otomatis refresh dan tampilkan notifikasi sukses
> 6. Jika gagal, tampilkan pesan error

---

### 4. Konsekuensi dan Trade-off

Ini bagian yang **paling penting** dan sering diabaikan. Jelaskan secara jujur:

- **Apa yang bisa salah?** — risiko dari implementasi ini
- **Mengapa pilihan ini, bukan yang lain?** — alasan di balik keputusan teknis
- **Apa yang perlu diperhatikan setelah ini?** — hal-hal yang perlu dijaga

**Template:**

```
Keuntungan pendekatan ini:
- [alasan A]
- [alasan B]

Risiko / hal yang perlu diperhatikan:
- [risiko A] -> cara mitigasi: [...]
- [risiko B] -> cara mitigasi: [...]

Alternatif yang tidak dipilih dan alasannya:
- [alternatif X]: tidak dipilih karena [alasan konkret]
```

---

### 5. Istilah Teknis yang Perlu Diketahui

Jika penjelasan mengandung istilah teknis, sertakan glosarium mini di bagian ini. Hanya sertakan istilah yang **tidak umum** atau yang maknanya khusus dalam konteks ini.

**Format:**

| Istilah | Artinya dalam konteks ini |
|---------|--------------------------|
| `Hook` | Fungsi khusus di React untuk mengakses fitur seperti state dan API |
| `Mutation` | Operasi yang mengubah data di server (bukan hanya membaca) |
| `Optimistic Update` | Memperbarui tampilan sebelum server konfirmasi, agar terasa lebih cepat |
| `Race Condition` | Situasi di mana dua proses berjalan bersamaan dan hasilnya tidak bisa diprediksi |

---

### 6. Checklist Verifikasi

Apa yang perlu dicek setelah implementasi selesai? Tulis dalam format checklist yang bisa langsung dikerjakan.

```
- [ ] Fitur berjalan sesuai alur yang dijelaskan di atas
- [ ] Tidak ada error di console browser
- [ ] Build berhasil tanpa error TypeScript
- [ ] Tampilan sudah konsisten dengan halaman lain di aplikasi
- [ ] Kondisi error ditangani dengan benar (misal: gagal koneksi)
```

---

## Aturan Penulisan yang Wajib Diikuti

### HARUS dilakukan

- **Mulai dari gambaran besar** sebelum masuk ke detail teknis
- **Gunakan analogi** jika konsepnya abstrak. Contoh: "Cache itu seperti catatan Post-it di meja — lebih cepat dibaca daripada buka buku tebal"
- **Tunjukkan contoh konkret** — jangan hanya teori
- **Jelaskan "kenapa"**, bukan hanya "apa". Developer perlu memahami alasan di balik keputusan
- **Gunakan formatting** — heading, bold, tabel, dan code block untuk memudahkan scanning
- **Sebutkan risiko secara jujur** — jangan sembunyikan kelemahan dari pendekatan yang dipilih

### JANGAN dilakukan

- Menulis satu blok teks panjang tanpa struktur
- Mengasumsikan developer sudah tahu istilah teknis tanpa penjelasan
- Menjelaskan hanya "apa yang dikerjakan" tanpa "kenapa" dan "dampaknya"
- Menggunakan kata-kata seperti "tentunya", "jelas bahwa", atau "mudah saja" — hal yang "jelas" bagi satu orang belum tentu jelas bagi orang lain
- Menghilangkan bagian konsekuensi karena dianggap tidak perlu

---

## Panduan Tingkat Kerumitan

Sesuaikan kedalaman penjelasan dengan kompleksitas perubahan:

| Skala Perubahan | Bagian yang Wajib Ada |
|-----------------|----------------------|
| **Kecil** (1-2 file, perubahan minor) | Ringkasan Singkat + Apa yang Diubah |
| **Sedang** (3-5 file, fitur baru) | Ringkasan + Diubah + Cara Kerja + Konsekuensi |
| **Besar** (arsitektur, banyak file) | Semua bagian + Istilah Teknis + Checklist |

---

## Contoh Penjelasan Lengkap

Berikut contoh penjelasan teknis yang mengikuti skill ini:

---

### Ringkasan Singkat

Kita akan menambahkan sistem filter di tabel data talent. Developer bisa memilih kategori talent (`organic`, `non_organic`, dll.) dan tabel akan otomatis menampilkan data yang sesuai tanpa reload halaman.

---

### Apa yang Akan Dibuat / Diubah

| Aksi | File | Penjelasan |
|------|------|-----------|
| Buat baru | `TalentFilterBar.tsx` | Komponen UI berisi tombol-tombol filter kategori |
| Ubah | `TalentTable.tsx` | Terima prop `activeFilter` dan filter data secara lokal |
| Ubah | `useTalentList.ts` | Kirim parameter filter ke API saat fetching data |

---

### Cara Kerjanya

1. Pengguna klik filter "Organic" di `TalentFilterBar`
2. State `activeFilter` berubah menjadi `"organic"` di komponen induk
3. `useTalentList` mengirim ulang request ke API dengan query `?category=organic`
4. API mengembalikan hanya data organic
5. `TalentTable` merender ulang dengan data baru

---

### Konsekuensi dan Trade-off

```
Keuntungan:
- Filter dilakukan di sisi server (server-side filtering), sehingga data besar tidak masalah
- Lebih efisien dari sisi memori browser

Risiko:
- Setiap klik filter memicu request API baru -> bisa lambat jika koneksi buruk
  -> Mitigasi: tampilkan loading skeleton saat menunggu response

Alternatif yang tidak dipilih:
- Client-side filtering (filter dari data yang sudah ada di browser):
  -> Tidak dipilih karena data talent bisa ribuan baris, tidak efisien dimuat sekaligus
```

---

### Istilah Teknis

| Istilah | Artinya |
|---------|---------|
| `Server-side filtering` | Filter dilakukan oleh backend, bukan browser |
| `Query parameter` | Bagian URL setelah `?` yang membawa informasi tambahan ke server, contoh: `?category=organic` |
| `Loading skeleton` | Tampilan "bayangan abu-abu" saat data sedang dimuat, memberikan feedback visual ke pengguna |

---

### Checklist Verifikasi

- [ ] Klik setiap opsi filter dan pastikan data berubah sesuai
- [ ] Pastikan loading state tampil saat filter berpindah
- [ ] Build TypeScript berhasil tanpa error

---

## Red Flags

Jika kamu melihat tanda-tanda ini dalam penjelasan, berarti skill ini belum diikuti dengan benar:

- Penjelasan dimulai langsung dengan nama file tanpa konteks
- Tidak ada penjelasan "kenapa" di balik keputusan teknis
- Tidak ada bagian konsekuensi atau risiko
- Istilah teknis digunakan tanpa penjelasan
- Penjelasan ditulis dalam satu paragraf panjang
- Menggunakan Bahasa Inggris untuk bagian yang bisa dijelaskan dalam Bahasa Indonesia
