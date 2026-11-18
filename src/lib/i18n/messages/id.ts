import type { Plural } from "../translate";
import type { Messages } from "./types";

const plural = (other: string, one?: string): Plural => ({ one, other });

export const id: Messages = {
  meta: {
    title: "QuranWeb",
    description: "Baca Al-Qur'an: teks Arab, terjemahan, audio murottal, dan tafsir.",
    myReadingTitle: "Bacaan saya",
  },
  nav: {
    quran: "Al-Quran",
    myReading: "Bacaan saya",
    language: "Bahasa",
    switchToLight: "Ganti ke mode terang",
    switchToDark: "Ganti ke mode gelap",
  },
  account: {
    signIn: "Masuk",
    signOut: "Keluar",
    signedInAs: "Masuk sebagai {name}",
    error: "Masuk belum bisa dipakai sekarang. Coba lagi nanti.",
  },
  footer: {
    intro: "Sumber tiap teks, terjemahan, tafsir, dan audio tercantum di bawah setiap surat. Data utama dari",
    and: "dan",
  },
  notFound: {
    title: "Halaman tidak ditemukan",
    description: "Halaman yang Anda cari tidak ada atau sudah dipindahkan.",
    home: "Kembali ke beranda",
  },
  common: {
    verses: plural("{count} ayat"),
    reading: "Bacaan",
    tafsir: "Tafsir",
  },
  revelation: { mecca: "Mekah", medina: "Madinah" },
  home: {
    title: "Baca Al-Qur'an",
    subtitle: "Teks Arab, transliterasi, terjemahan, audio murottal, dan tafsir.",
    start: "Mulai dari Al-Fatihah",
    listTitle: "Daftar surat",
    searchPlaceholder: "Cari nama atau nomor…",
    searchLabel: "Cari surat",
    noResults: "Surat tidak ditemukan.",
  },
  continueReading: {
    label: "Lanjutkan membaca",
    position: "{surah}, ayat {verse}",
  },
  reader: {
    jumpToVerse: "Lompat ke ayat",
    jumpPlaceholder: "Ayat…",
    verseOption: "Ayat {number}",
    previousSurah: "Surat sebelumnya",
    nextSurah: "Surat berikutnya",
    sources: "Sumber: {list}",
    audioBy: "Audio {qari}",
  },
  pagination: {
    label: "Halaman",
    previous: "Halaman sebelumnya",
    next: "Halaman berikutnya",
    page: "Halaman {number}",
    range: "Ayat {from}–{to} dari {total}",
  },
  verse: {
    play: "Putar audio",
    pause: "Jeda audio",
    bookmark: "Beri penanda ayat",
    removeBookmark: "Hapus penanda ayat",
    markRead: "Tandai sudah dibaca sampai ayat ini",
    unmarkRead: "Batalkan tanda sudah dibaca",
    copy: "Salin ayat",
    copyLink: "Salin tautan ayat",
    copied: "Tersalin",
    read: "sudah dibaca",
    addNote: "Tambah catatan",
    note: "Catatan: {note}",
    noteLabel: "Catatan untuk ayat ini",
    notePlaceholder: "Catatan pribadi (disimpan di browser ini)",
    tafsirNotSelected: "Tafsir tidak dipilih. Pilih tafsir di pengaturan bacaan.",
  },
  settings: {
    title: "Pengaturan bacaan",
    arabic: "Teks Arab",
    translation: "Terjemahan",
    tafsir: "Tafsir",
    qari: "Qari",
    noTafsir: "Tanpa tafsir",
    savedInBrowser: "Pilihan disimpan di browser ini.",
    show: { arabic: "Teks Arab", transliteration: "Transliterasi", translation: "Terjemahan" },
    languages: { ar: "Arab", id: "Indonesia", en: "Inggris" },
  },
  myReading: {
    title: "Bacaan saya",
    subtitle: "Terakhir dibaca, progres, dan penanda ayat. Tersimpan di browser ini, tanpa akun.",
    lastRead: {
      title: "Terakhir dibaca",
      empty: "Belum ada bacaan tersimpan. Buka sebuah surat dan posisi bacaan Anda akan dicatat otomatis.",
      resume: "Lanjutkan",
    },
    progress: {
      title: "Progres baca",
      empty: "Belum ada surat yang ditandai. Pakai tombol centang di sebuah ayat untuk menandai bacaan sampai ayat itu.",
      detail: "ayat {read} dari {total} ({percent}%)",
      remove: "Hapus",
    },
    bookmarks: {
      title: "Penanda ayat",
      empty: "Belum ada penanda. Pakai ikon penanda di sebuah ayat untuk menyimpannya.",
      remove: "Hapus",
      unknownSurah: "Surat {number}",
    },
    backup: {
      title: "Cadangan",
      description:
        "Data ini hanya tersimpan di browser ini. Unduh cadangan untuk memindahkannya ke perangkat lain, lalu impor di sana; data yang diimpor digabungkan, tidak menimpa.",
      download: "Unduh cadangan",
      import: "Impor cadangan",
      imported: "Cadangan digabungkan dengan data di browser ini.",
      readFailed: "Berkas tidak bisa dibaca.",
      errors: {
        notJson: "Berkas bukan JSON yang valid.",
        notBackup: "Berkas ini bukan cadangan QuranWeb.",
        unsupportedVersion: "Cadangan ini berasal dari versi yang tidak didukung.",
        invalid: "Cadangan berisi data yang tidak valid.",
      },
    },
  },
};
