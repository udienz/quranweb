import type { Plural } from "../translate";

const plural = (other: string, one?: string): Plural => ({ one, other });

/** English is the source catalog: the shape of every other language is derived from it. */
export const en = {
  meta: {
    title: "QuranWeb",
    description: "Read the Qur'an: Arabic text, translations, recitation audio and tafsir.",
    myReadingTitle: "My reading",
  },
  nav: {
    quran: "Al-Quran",
    myReading: "My reading",
    language: "Language",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
  },
  account: {
    signIn: "Sign in",
    signOut: "Sign out",
    signedInAs: "Signed in as {name}",
    syncFailed: "Could not sync with your account. Your reading is safe on this device and will sync later.",
    error: "Sign-in is not available right now. Try again later.",
  },
  footer: {
    intro: "The sources of every text, translation, tafsir and recitation are listed under each surah. Main data from",
    and: "and",
  },
  notFound: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has moved.",
    home: "Back to the home page",
  },
  common: {
    verses: plural("{count} verses", "{count} verse"),
    reading: "Reading",
    tafsir: "Tafsir",
  },
  revelation: { mecca: "Mecca", medina: "Medina" },
  home: {
    title: "Read the Qur'an",
    subtitle: "Arabic text, transliteration, translations, recitation audio and tafsir.",
    start: "Start with Al-Fatihah",
    listTitle: "Surahs",
    searchPlaceholder: "Search by name or number…",
    searchLabel: "Search surahs",
    noResults: "No surah found.",
  },
  continueReading: {
    label: "Continue reading",
    position: "{surah}, verse {verse}",
  },
  reader: {
    jumpToVerse: "Jump to verse",
    jumpPlaceholder: "Verse…",
    verseOption: "Verse {number}",
    previousSurah: "Previous surah",
    nextSurah: "Next surah",
    sources: "Sources: {list}",
    audioBy: "Audio {qari}",
  },
  pagination: {
    label: "Pages",
    previous: "Previous page",
    next: "Next page",
    page: "Page {number}",
    range: "Verses {from}–{to} of {total}",
  },
  verse: {
    play: "Play audio",
    pause: "Pause audio",
    bookmark: "Bookmark this verse",
    removeBookmark: "Remove bookmark",
    markRead: "Mark as read up to this verse",
    unmarkRead: "Undo mark as read",
    copy: "Copy verse",
    copyLink: "Copy link to verse",
    copied: "Copied",
    read: "read",
    addNote: "Add a note",
    note: "Note: {note}",
    noteLabel: "Note for this verse",
    notePlaceholder: "Personal note (saved in this browser)",
    tafsirNotSelected: "No tafsir selected. Choose one in the reading settings.",
  },
  settings: {
    title: "Reading settings",
    arabic: "Arabic text",
    translation: "Translation",
    tafsir: "Tafsir",
    qari: "Reciter",
    noTafsir: "No tafsir",
    savedInBrowser: "Your choices are saved in this browser.",
    show: { arabic: "Arabic text", transliteration: "Transliteration", translation: "Translation" },
    languages: { ar: "Arabic", id: "Indonesian", en: "English" },
  },
  myReading: {
    title: "My reading",
    subtitle: "Last read, progress and bookmarks. Saved in this browser, no account needed.",
    lastRead: {
      title: "Last read",
      empty: "Nothing saved yet. Open a surah and your reading position is recorded automatically.",
      resume: "Continue",
    },
    progress: {
      title: "Reading progress",
      empty: "No surah marked yet. Use the check button on a verse to mark your reading up to it.",
      detail: "verse {read} of {total} ({percent}%)",
      remove: "Remove",
    },
    bookmarks: {
      title: "Bookmarks",
      empty: "No bookmarks yet. Use the bookmark button on a verse to save it.",
      remove: "Remove",
      unknownSurah: "Surah {number}",
    },
    backup: {
      title: "Backup",
      description:
        "This data is only stored in this browser. Download a backup to move it to another device, then import it there; imported data is merged, never overwritten.",
      download: "Download backup",
      import: "Import backup",
      imported: "The backup was merged with the data in this browser.",
      readFailed: "The file could not be read.",
      errors: {
        notJson: "The file is not valid JSON.",
        notBackup: "This file is not a QuranWeb backup.",
        unsupportedVersion: "This backup comes from a version that is not supported.",
        invalid: "The backup contains invalid data.",
      },
    },
  },
};
