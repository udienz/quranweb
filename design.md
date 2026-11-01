# QuranWeb — Rencana Migrasi PHP Modern

## 1. Konfirmasi Kondisi Saat Ini

Sudah saya clone dan audit repo `udienz/quranweb`. Ringkasan temuannya:

- **Tidak ada `composer.json`** — tidak ada dependency management sama sekali. Semua library (termasuk ADOdb) di-vendor manual di `lib/`.
- **137 file PHP/inc**, gaya penulisan era PHP 4/5 (sekitar pertengahan 2000-an, berdasarkan referensi InfoLinux di README).
- **Ekstensi `mysql_*` dipakai di 24 file** (`admin/login.php`, `admin/*.php`, `include/search.inc.php`, `include/QSearch.class.php`, `footnote.php`, `tanggapan.php`, `download/download.inc.php`, dll). Ekstensi ini **sudah dihapus total sejak PHP 7.0** — ini blocker #1, kode tidak akan jalan sama sekali di PHP modern tanpa diubah.
- **SQL Injection langsung ditemukan** di `admin/login.php`: input `$_POST['user']` ditempel langsung ke query tanpa escaping/parameter binding. Pola serupa kemungkinan besar berulang di file lain yang pakai `mysql_query($q)` dengan variabel dari `$_REQUEST/$_GET/$_POST`.
- **Short open tag (`<?`) dipakai di 111 file**, hanya 26 file yang pakai `<?php` penuh. PHP modern masih mendukung `short_open_tag`, tapi default `php.ini` di banyak hosting men-disable ini — jadi secara praktik ini blocker juga.
- `HTTP_GET_VARS` / superglobal lama ditemukan di 5 file (dihapus sejak PHP 5.4).
- `ereg()`/`eregi()` dipakai 1 file (dihapus sejak PHP 7.0, fungsi POSIX regex lama).
- `each()` dipakai di 2 file (dihapus sejak PHP 8.0).
- Struktur aplikasi: `index.php` (frontend publik), `admin/` (panel admin, auth sangat lemah — hanya cek session), `include/` (class & logic utama, pola prosedural + beberapa class `Q*.class.php`), `lib/adodb` (DB abstraction lama tapi berguna), `database/*.sql` (schema MySQL lama).
- Tidak ada test otomatis sama sekali.

**Kesimpulan:** ini bukan "upgrade versi", ini migrasi penuh — codebase ditulis untuk PHP 4/5 dengan asumsi MySQL ext lama dan tanpa pemisahan keamanan dasar. Realistis butuh beberapa tahap, bukan satu kali ganti versi di `php.ini`.

## 2. Target

- **Target utama: PHP 8.4** (actively supported, kompatibilitas library paling luas saat ini).
- Uji kompatibilitas tambahan ke **PHP 8.5** (stable terbaru) karena gap-nya kecil dari 8.4.
- MySQL/MariaDB tetap dipertahankan sebagai DB, tapi akses via `mysqli` atau `PDO` (prepared statements), bukan lagi lewat ekstensi `mysql_*`.

## 3. Rencana Migrasi Bertahap

### Fase 0 — Baseline & Safety Net
- Setup environment lokal dengan PHP lama (5.6/7.0) via Docker untuk punya baseline yang jalan, screenshot/behavior reference sebelum diubah.
- Import `database/Quransql.sql` ke MySQL lokal untuk testing.
- Inventaris semua entry point (`index.php`, `admin/*.php`, file-file top-level seperti `balloon.php`, `tanggapan.php`, `footnote.php`, dll) — ini daftar "harus tetap jalan" setelah migrasi.

### Fase 1 — Modernisasi Sintaks Dasar (tidak mengubah logic)
- Ganti semua `<?` → `<?php` di 111 file (scriptable dengan regex, tapi harus hati-hati terhadap `<?xml` kalau ada, dan false positive).
- Hapus/ganti `HTTP_*_VARS` → `$_GET`/`$_POST`/`$_SERVER`/`$_SESSION`.
- Ganti `ereg`/`eregi` → `preg_match`.
- Ganti `each()` → `foreach`.
- Pisahkan file backup/duplikat yang ikut ter-commit (`*_`, `search.inc.php_`, `QDefaultDisplay.class.php_`) — ini sampah versi lama, bukan dipakai aplikasi tapi bikin bingung saat migrasi. Konfirmasi dulu tidak di-include di manapun, lalu hapus atau pindahkan ke folder `legacy/`.

### Fase 2 — Lapisan Database (blocker terbesar)
Ini bagian paling berisiko karena menyentuh setiap query.

Dua opsi:
1. **Cepat/minim-risiko:** ganti `mysql_*` → `mysqli_*` secara 1:1 (`mysql_connect` → `mysqli_connect`, `mysql_query($q)` → `mysqli_query($link, $q)`, dst). API-nya mirip, tapi `mysqli_query` butuh parameter koneksi eksplisit, jadi tetap perlu disentuh satu per satu.
2. **Benar/aman:** sekalian pindah ke **PDO + prepared statements**, sekaligus menutup celah SQL injection seperti di `admin/login.php`. Lebih banyak kerjaan di awal, tapi sekali jalan dua masalah (kompatibilitas + keamanan) selesai bareng.

**Rekomendasi saya: opsi 2.** Alasannya: celah SQL injection di panel admin itu bukan isu kecil — aplikasi ini akan tetap dipakai setelah migrasi, jadi percuma kalau cuma dibikin "jalan di PHP baru" tapi tetap bisa dibobol. Karena bagian DB sudah harus ditulis ulang total (karena `mysql_*` dihapus), biaya tambahan untuk sekalian pakai prepared statements relatif kecil dibanding menulis ulang dua kali.

- ADOdb di `lib/adodb` sudah mendukung driver `mysqli`/`pdo` — perlu dicek apakah ADOdb dipakai aktif di jalur eksekusi utama atau cuma vendor yang nganggur (dari audit awal, call `mysql_*` langsung lebih banyak dipakai daripada lewat ADOdb). Kalau ADOdb tidak krusial, pertimbangkan drop saja daripada maintain dua lapisan DB.

### Fase 3 — Validasi Input & Keamanan Dasar
- Audit semua titik yang menerima `$_GET/$_POST/$_REQUEST` dan langsung masuk ke query atau di-echo ke HTML (potensi SQLi dan XSS, terutama di `admin/`, `tanggapan.php`, `feedback.inc.php`).
- Tambahkan `password_hash()`/`password_verify()` untuk auth admin — saat ini pakai `md5()` polos (`admin/login.php`), itu sudah tidak dianggap aman untuk password sejak lama.
- Review session handling (`session_start()` dipanggil manual di banyak file — rawan duplikasi/inkonsistensi).

### Fase 4 — Testing & Deployment
- Karena tidak ada test otomatis, prioritaskan **manual regression testing** berbasis daftar fitur dari Fase 0: pencarian ayat, baca surah, panel admin (tambah ayat, feedback, footnote), download, audio player.
- Baru di fase ini pertimbangkan nulis beberapa test dasar (smoke test tiap endpoint) kalau mau investasi jangka panjang.
- Deploy ke staging PHP 8.4 dulu, baru production.

## 4. Hal yang Perlu Diputuskan Bareng Sebelum Mulai

1. **Lingkup konten non-kode**: ada file `.swf` (Flash — sudah mati total di semua browser modern), `.xpi` (Firefox extension lama), `.TTF` ikut nangkring di root. Apakah ini masih dipakai (mis. `mp3player.swf` untuk player audio) atau sisa peninggalan yang aman dihapus? Kalau masih dipakai untuk fitur audio, itu perlu diganti ke player HTML5 — bukan masalah PHP, tapi blocker fungsional kalau tetap mengandalkan Flash.
2. **Opsi 1 vs opsi 2 di Fase 2** (mysqli 1:1 vs PDO+prepared statements) — saya condong opsi 2, tapi ini trade-off waktu vs keamanan yang sebaiknya Anda yang putuskan.
3. **Nasib panel admin**: apakah masih dipakai aktif untuk mengelola konten, atau isi Qur'an/terjemahan sudah final dan admin panel bisa di-retire? Ini menentukan berapa banyak effort yang masuk akal dicurahkan ke Fase 3 untuk `admin/`.

Saya tahan dulu eksekusi sampai poin-poin di atas dikonfirmasi, supaya tidak salah arah di Fase 2 (bagian paling mahal untuk diubah lagi kalau pilihannya salah).
