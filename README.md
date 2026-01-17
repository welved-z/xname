# Sistem Kaderisasi Digital — Starter Project (MPK OSIS 71 - CAS)

Ringkasan
- Starter web app mobile-first menggunakan: HTML + Tailwind CSS + vanilla JS + Firebase (Auth Google Sign‑In, Firestore, Storage).
- Tujuan: MVP untuk Dashboard, Jurnal Kegiatan, Rekap Absensi, dan Profile admin (Angkatan 27).
- Anda menerima file minimal untuk dideploy ke Firebase Hosting atau GitHub Pages.

Persiapan singkat
1. Buat folder project, taruh file yang ada di repo ini.
2. Tambahkan logo CAS yang Anda kirim ke `assets/cas-logo.png`. (jika Anda punya dua file logo bisa simpan di `assets/cas-logo.png` dan `assets/cas-emblem.png`).
3. Ganti `firebaseConfig` di `firebase.js` jika ingin (saya sudah mengisi dengan config yang Anda kirim).

Fitur yang sudah terimplementasi
- Google Sign‑in (Auth)
- Dashboard sample (counts & cards)
- Jurnal Kegiatan: form input narasi, tags, pilih proker & pilih kader → simpan ke Firestore (collection `entries`)
- Realtime update: onSnapshot untuk entries & users
- Avatar dropdown: Profile (modal), Logout
- Firestore rules contoh (`firestore.rules`)

Struktur Firestore yang direkomendasikan
- users (docId = uid)
  - name, username, role ('admin'|'kader'), position, class, avatarUrl, cohort, createdAt
- prokers (auto id)
  - title, date, description
- entries (auto id)
  - userId, prokerId, authorId, date, narrative, skills (array), tags (array)
- attendance (opsional)
  - userId, date, status (present/absent), note

Langkah konfigurasi Firebase (singkat)
1. Buka https://console.firebase.google.com → Buat project (`kaderisasi-mpkosis71` atau sesuai).
2. Authentication → Sign‑in method → aktifkan Google.
3. Firestore → Buat database (lokasi: pilih terdekat), pilih mode "test" saat dev (ingat ganti rules sebelum produksi).
4. Storage → buat bucket default.
5. Hosting (opsional): `firebase init hosting` → pilih project → build folder = `public` atau `.` sesuai.
6. Jika menggunakan Firebase CLI:
   - npm i -g firebase-tools
   - firebase login
   - firebase init
   - firebase deploy

Deploy ke GitHub Pages (alternatif)
- Jika Anda hanya menghosting front-end static:
  - Push repo ke GitHub
  - Aktifkan Pages pada Settings → Pages → pilih branch
  - Pastikan `firebaseConfig` benar & Firestore rules mengizinkan akses yang sesuai

Security rules (awal)
- `firestore.rules` disertakan sebagai contoh. Harap sesuaikan production rules dan gunakan custom claims untuk admin.

Next steps saya bisa bantu
- Saya bisa membuat repo GitHub untuk Anda dan push file (jika Anda beri akses) OR
- Membuat UI form tambah narasi lebih maju (image attachments ke Storage) — Anda pilih.
