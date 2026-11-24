# QuranWeb

**English** · [Bahasa Indonesia](README.id.md)

An open-source Qur'an reader with multilingual translations, recitations, tafsir, and tools to support your daily reading.

[![CI](https://img.shields.io/github/actions/workflow/status/udienz/quranweb/ci.yml?branch=master&label=CI)](https://github.com/udienz/quranweb/actions/workflows/ci.yml) [![License](https://img.shields.io/github/license/udienz/quranweb)](LICENSE) [![Latest release](https://img.shields.io/github/v/release/udienz/quranweb?display_name=tag)](https://github.com/udienz/quranweb/releases) [![Website](https://img.shields.io/website?url=https%3A%2F%2Fquranweb.udienz.web.id)](https://quranweb.udienz.web.id)

A free website for reading the Qur'an: the Arabic text, translations (Indonesian, English, Turkish, Malay, Bengali, French, Russian, Urdu, Persian, Spanish, Bosnian, Chinese, Thai, Uzbek, Tamil, Malayalam, German, Portuguese, Hindi, Swahili, Hausa, Japanese, Vietnamese and others), recitation
audio and tafsir. You do not need an account, and there are no ads. Visits are counted with Cloudflare Web Analytics, which,
according to Cloudflare, sets no cookies and does not identify you (see the privacy policy).

**Open it at https://quranweb.udienz.web.id**

![Reading page in the mushaf layout: surah list on the left, the Arabic text as one block with the numbered translation beside it](docs/screenshots/en/reading.png)

## Contents

- [What you can do](#what-you-can-do)
- [Languages](#languages)
- [How to use QuranWeb](#how-to)
- [Your reading and your privacy](#your-reading-and-your-privacy)
- [Sources and credits](#sources-and-credits)
- [On a phone](#on-a-phone)
- [Feedback and help](#feedback-and-help)
- [Licence](#licence)
- [For developers](#for-developers)

## What you can do

- **Read all 114 surahs** in the Arabic text (Uthmani Hafs or the EQuran.id text), with one or more translations side by side
  and a Latin transliteration you can turn on (Indonesian Kemenag, Yusuf Ali, Pickthall and others). ([how](#choose-the-text-and-translations))
- **Search the Qur'an** for a word in the Arabic text (with or without vowel marks) or in a translation, in all surahs or in one,
  and see the words found marked. *Shalat*, *salat* and *sholat* find each other. ([how](#search-the-quran))
- **Jump to a verse** by typing its reference in the surah search box: *2:255*, *baqarah 255* or *QS. Al-Baqarah: 255*.
- **Read like a printed mushaf**: the Arabic text of a page runs as one block, with the translation beside it (below it
  on phones). Prefer one card per verse? Switch it in the settings. ([how](#switch-between-mushaf-and-verse-by-verse))
- **Read the pages of the printed mushaf**: the 604 pages of the Madinah mushaf, each with the Arabic text as one block and the
  translation beside it. Turn pages with buttons, a page number, the arrow keys or a swipe; the audio plays on across the surahs
  of a page and on to the next page. Choose it in Settings. ([how](#read-the-pages-of-the-mushaf))
- **Listen** to the recitation verse by verse, from 23 reciters. The best known are at the top of the list, and you can
  search by name. Playback moves on to the next verse by itself; at the end of a surah it stops, repeats the surah or goes
  on to the next one, as you choose. You can also **play a whole juz**, across surahs. ([how](#listen-to-a-recitation))
- **Control the audio** from your phone's lock screen (pause, next verse), or on a computer with Space (play or pause) and
  N and P (next and previous verse). A data-saver mode plays smaller files on mobile data. ([how](#control-the-audio))
- **Memorize**: hear each verse two, three or more times, repeat a range of verses (for example 2:1–5) as many
  times as you like, and blur the Arabic or the translation to test yourself, tapping a verse to check it. ([how](#memorize-a-passage))
- **Read the tafsir** of a verse in the Tafsir tab (Kemenag, Quraish Shihab, Jalalayn or Al-Mukhtasar;
  Al-Mukhtasar also in Arabic, English, Turkish, Bengali, French, Russian, Persian, Bosnian, Chinese, Thai, Uzbek, Tamil,
  Malayalam, Italian, Hindi, Japanese and Vietnamese). ([how](#read-the-tafsir))
- **See a verse of the day** on the home page: the Arabic text and your translation, with a link to read it in its surah. It
  changes at midnight in Indonesia and goes through a list of verses chosen by hand.
- **Pick up where you stopped** with "continue reading", and mark how far you have read. ([how](#continue-reading-and-mark-your-progress))
- **Bookmark verses**, add your own notes, and group them into collections. ([how](#bookmarks-notes-and-collections))
- **Set a daily goal** (in verses or pages a day), keep a streak going, and see your progress towards a khatam. ([how](#set-a-daily-goal))
- **Use it in your language**: the interface is in 25 languages (the list is under [Languages](#languages)); Urdu, Arabic
  and Persian read right to left. Apart from Indonesian and English they are community translations, not yet checked by a
  second speaker (Turkish was translated by a reader, the other twenty-two are first drafts by Claude, an AI). The menu
  marks them with an asterisk (*) and a note, and each has a link to report a mistake. Each language shows a translation and a tafsir in that language by default, or in English when
  our sources have none. The site follows your browser's language until you pick one in the header or on the Settings page.
  When you are signed in, your choice follows you. ([how](#change-the-language))
- **Make it comfortable**: a light, dark or automatic theme, and larger or smaller Arabic and Latin text, each on its
  own, on the Settings page. When you are signed in, your settings follow you to your other devices. ([how](#theme-and-text-size))
- **Share a verse**: copy its text with the reference and a link, copy only the link, open your phone's share sheet or send it by
  WhatsApp. A link to a verse, `/surah/2/255`, has its own page, and a link to a verse or a surah shows a preview with its
  reference and its text in WhatsApp, Telegram or X. ([how](#share-a-verse))
- **Install it as an app** on your phone or computer, with its own icon and window: "Install app" in Chrome or Edge,
  "Add to Home Screen" in Safari on an iPhone. It still needs an internet connection. ([how](#install-it-as-an-app))

Long surahs are split into pages of 10 verses: a page of Al-Baqarah is about 230 KB instead of about 2 MB for the whole surah.

## Languages

The interface comes in the 25 languages below, listed as the language menu lists them: alphabetically by the language's own
name, Latin script first, each with a flag. Choosing one also sets the translation and tafsir a new reader sees first; you
can change both in Reading settings, and choose from every translation and tafsir whatever the interface language. Where
our sources have no translation or no tafsir in a language, the site shows the English one: those cells say "English".

| Interface | Translation shown first | Tafsir shown first |
|---|---|---|
| Bahasa Indonesia | Kemenag | Kemenag |
| Bahasa Melayu (Malay) | Abdullah Basmeih | Kemenag (Indonesian, which Malay readers follow easily) |
| Bosanski (Bosnian) | Rowwad Translation Center | Al-Mukhtasar |
| Deutsch (German) | Frank Bubenheim and Nadeem Elyas | English: Al-Mukhtasar |
| English | Yusuf Ali | Al-Mukhtasar |
| Español (Spanish) | Isa Garcia | English: Al-Mukhtasar |
| Français (French) | Rachid Maach | Al-Mukhtasar |
| Hausa | Abubakar Mahmoud Gumi | English: Al-Mukhtasar |
| Italiano (Italian) | English: Yusuf Ali | Al-Mukhtasar |
| Kiswahili (Swahili) | Ali Muhsin Al-Barwani | English: Al-Mukhtasar |
| Português (Portuguese) | Helmi Nasr | English: Al-Mukhtasar |
| Tiếng Việt (Vietnamese) | Rowwad Translation Center | Al-Mukhtasar |
| Türkçe (Turkish) | Diyanet İşleri | Al-Mukhtasar |
| Русский (Russian) | Elmir Kuliev | Al-Mukhtasar |
| Ўзбекча (Uzbek) | Rowwad Translation Center | Al-Mukhtasar |
| اردو (Urdu) | Muhammad Junagarhi | Tafsir Ibn Kathir |
| العربية (Arabic) | none (the Arabic text only) | Al-Mukhtasar in Arabic |
| فارسی (Persian) | Rowwad Translation Center | Al-Mukhtasar |
| हिन्दी (Hindi) | Azizul Haq Al-Omari | Al-Mukhtasar |
| বাংলা (Bengali) | Muhiuddin Khan | Al-Mukhtasar |
| தமிழ் (Tamil) | Omar Sharif | Al-Mukhtasar |
| മലയാളം (Malayalam) | Abdul Hamid Haidar and Kunhi Muhammad | Al-Mukhtasar |
| ไทย (Thai) | Rowwad Translation Center | Al-Mukhtasar |
| 中文 (Chinese) | Ma Jian | Al-Mukhtasar |
| 日本語 (Japanese) | Saeed Sato | Al-Mukhtasar |

Unless the table says otherwise, a translation or tafsir is in the language of its row.

Every language except Bahasa Indonesia and English is a community translation, marked with an asterisk (*) in the menu:
no second speaker has reviewed it yet. If you speak one of them, a review is the most useful help you can give; it is what
makes the language official. [CONTRIBUTING.md](CONTRIBUTING.md), "From community to official", explains how.

## How to

The pictures show the English interface; the Indonesian README shows the Indonesian one. The bookmarks, goal and progress
in them are sample data.

Most choices are in **Reading settings**, below the surah list on the left of a surah. On a phone, open the folded "Surah
list and settings" panel above the surah. Every setting is also on the **Settings** page: open the person button at the
top right (it reads "Sign in" until you sign in) and choose Settings.

### Choose the text and translations

![Al-Fatihah verse by verse, with the Yusuf Ali and Pickthall translations under each verse](docs/screenshots/en/how-translations.png)

1. Open a surah from the home page, or type its name or number in the search box above the surah list.
2. In Reading settings, pick the Arabic text, then a language under Translation and one or more translations in it. Each
   one you add appears under the verse; remove one with the cross on its label.
3. Turn the Arabic text, the transliteration or the translation on or off in the same panel. The transliteration is off
   until you turn it on. **Tajweed colours** (on by default) colour the Arabic text by its tajweed rules; turn them off to
   read your chosen Arabic text. **Ruku marks** put ع at the end of each ruku.
   The **Arabic font** can be Amiri or the King Fahd Complex's own Uthmanic Hafs font (in the panel and on Settings).
4. Changed the interface language? Your translations and tafsir stay as they were. **Use the translation and tafsir in …**
   switches them to the ones of the new language. The tafsir list starts with the interface language.
5. A list with more than 10 choices (translation languages, tafsir, verses, juz, interface languages) has a search box: type a
   few letters, then pick with the arrow keys and Enter, or tap.

### Switch between mushaf and verse by verse

The picture at the top of this page is the mushaf layout.

1. In Reading settings, under Layout, choose **Mushaf** or **Verse by verse**.
2. On wide screens, "Hide surah list and settings" above the surah gives the text the whole width.

### Read the pages of the mushaf

![The last page of the mushaf, page 604: Al-Ikhlas and Al-Falaq, each with its name, a Play the surah button and the Bismillah, the Arabic text as one block with the numbered translation beside it](docs/screenshots/en/how-mushaf-page.png)

![Page division in the reading settings, with Mushaf pages (604) chosen](docs/screenshots/en/how-page-division.png)

Open **Settings**, and under **Reading settings** choose **Mushaf pages (604)** next to "Page division". A page of the mushaf
has the surah list and the reading settings beside it (folded above it on a phone), so you can go back to **10 verses** from
there. A surah then opens at the
page of the printed mushaf that has its first verse, and an old link to a page of 10 verses opens the page that has that page's
first verse. A page can hold the end of one surah and the start of the next (the last page holds three). Turn pages with
**Previous page** and **Next page**, type a number from 1 to 604 in the box, press the right or left arrow key (the other way round
in a right-to-left language) or swipe sideways. The page number is shown above and below the page. **Play the surah** under a surah's name plays the whole recording of that surah, with no verse chosen first (for the reciters that have one). Choose **10 verses** to go back to
pages of 10 verses, which stay the default. The choice follows your account when you are signed in.

### Listen to a recitation

![The Audio section of the Settings page: reciter, audio quality, what happens when the surah ends, and a list to play a juz](docs/screenshots/en/how-listen.png)

1. Choose a reciter in Reading settings or in the Audio section of the Settings page. Type part of a name in the search
   box at the top of the list to find one.
2. Press play on a verse. In the mushaf layout, tap the verse number first: a bar with the play button opens at the
   bottom.
3. To choose what happens at the end of the surah, use the list in the surah header (Stop at the end, Repeat the surah,
   Play the next surah).
4. To play a whole juz, pick it in the "Juz…" list in the surah header or under "Play a juz" on the Settings page.

### Control the audio

- On a phone, the lock screen shows the verse and the reciter, with pause and next and previous verse. Nothing to set up.
- On a computer, on a surah page: Space plays or pauses, N goes to the next verse, P to the previous one.
- On mobile data, set Audio quality to "Data saver" in the Audio section of the Settings page (picture above). It is kept
  on that device only. With some reciters it changes nothing, and the text under the list says so.

### Memorize a passage

![The Memorize panel open on Al-Ikhlas: each verse three times, verses 1 to 4 repeated three times, the Arabic text blurred](docs/screenshots/en/how-memorize.png)

1. Open the surah and press **Memorize** in its header.
2. "Play each verse" sets how many times each verse plays before the next one.
3. "Repeat verses": choose the first and last verse and how many times, then press **Start**. Press Stop to end it early.
4. "Hide while memorizing" blurs the Arabic text or the translation. Tap a blurred verse to check it, and tap again to hide
   it.

### Read the tafsir

![Tafsir tab with Tafsir Jalalayn](docs/screenshots/en/tafsir.png)

1. Open the **Tafsir** tab in the surah header.
2. Choose the tafsir in Reading settings, under Tafsir.

### Continue reading and mark your progress

![Home page with continue reading](docs/screenshots/en/home.png)

![The verse bar in the mushaf layout, verse 2 of Al-Fatihah selected, with play, bookmark, mark as read, copy and copy link](docs/screenshots/en/how-verse-actions.png)

1. Just read: the site records the verse you reached. "Continue reading" on the home page takes you back to it.
2. To mark how far you have read, press the check button on a verse ("Mark as read up to this verse"). In the mushaf
   layout it is in the bar that opens when you tap a verse number. Verses marked as read get a line beside them.
3. Your progress per surah is on the **My reading** page (person button at the top right, then My reading).

### Bookmarks, notes and collections

![Bookmarks on My reading: three bookmarks, two in a collection called Morning, two with a note](docs/screenshots/en/how-bookmarks.png)

1. Press the bookmark button on a verse.
2. A bookmarked verse shows "Add a note" under it: write your note there.
3. On My reading, under Bookmarks, type a name in "New collection" and press **Add**. Then put a bookmark in it with the
   list beside that bookmark. The buttons at the top show one collection at a time.

### Set a daily goal

![Daily goal on My reading: 2 pages a day, 1.4 of 2 pages today, 5 days in a row, and the progress towards a khatam](docs/screenshots/en/how-daily-goal.png)

1. On My reading, under Daily goal, choose how many verses a day, or how many pages of the mushaf (20 pages a day is a juz a day).
2. Only verses you mark as read count (see above); reading without marking does not.
3. The page shows today's count, how many days in a row you reached the goal, and how far you are towards a khatam.

### Change the language

![The language menu open in the header: languages in alphabetical order by their own names, each with a flag (Bahasa Indonesia, Bahasa Melayu, Bosanski, Deutsch, English and more), community translations marked with an asterisk](docs/screenshots/en/how-language.png)

Press the globe button at the top (it shows the code of the current language, such as EN or FR) and pick a language, or use "Interface language" on the
Settings page. The languages are in alphabetical order of their own names, each with a flag; the menu scrolls when it is
taller than the screen. This changes the menus and buttons only. The translations of the Qur'an are chosen in Reading settings.

### Theme and text size

![Language, theme and text size on the Settings page](docs/screenshots/en/how-display.png)

![Dark theme](docs/screenshots/en/reading-dark.png)

1. The moon or sun button at the top switches between light and dark.
2. For the automatic theme, which follows your device, and for the text size, go to the Settings page, section
   "Language, theme and text size". The Arabic and the Latin text each have their own size buttons.

### Search the Qur'an

Press the magnifier button at the top, or use the search box on the home page. Type a word and press Search: the verses
that have it come in the order of the Qur'an, 20 to a page, with the words found marked, and each result opens that verse in
the surah. Choose a surah next to the box to search only in it. An Arabic word is found with or without its vowel marks, and
also when the article or a preposition is attached to it. A reference such as *2:255* is offered as a link. The search covers
the Arabic text, the transliteration, the Indonesian Kemenag translation, the English translations of Yusuf Ali and Pickthall
and the Turkish, Malay, Bengali and Russian ones; the other translations and the tafsir are not searched. The words you type
are sent to our server to find the verses and are not kept with your account (see the privacy policy).

### Share a verse

Press the share button on a verse and choose **Copy verse** (the Arabic and your translations, the reference such as
"Qur'an 2:255 (Al-Baqarah)" and a link), **Copy link to verse**, **Share…** (your phone's own share sheet, where the browser
has one) or **WhatsApp**. In the mushaf layout, tap the verse number first (picture under "Continue reading and mark your
progress"). The link opens the verse on a page of its own, with a link to read it in the surah and to the verses before and
after it.

### Install it as an app

- Chrome or Edge on a computer or Android phone: choose "Install app" (in the address bar or the browser menu).
- Safari on an iPhone: the Share button, then "Add to Home Screen".

The app still needs an internet connection.

## Your reading and your privacy

Without an account, everything you do (where you stopped, bookmarks, notes, your goal) stays in your browser on that
device. From "My reading" you can save it to a file and import it again, on the same or another device.

If you want the same reading on your phone and your computer, you can sign in with your Google account. It is optional.
You can download everything kept with your account, or delete the account, at any time. What is kept and why is in the
privacy policy: https://quranweb.udienz.web.id/privacy. The terms of use are at https://quranweb.udienz.web.id/terms.

## Sources and credits

The Arabic text, translations and tafsir come from published sources: [EQuran.id](https://equran.id) (the Arabic text,
translation and tafsir of Kementerian Agama RI, and the recitations), [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) and
[QuranEnc.com](https://quranenc.com), and the Urdu Tafsir Ibn Kathir from [Quran Foundation](https://quran.foundation/) (Quran.com); more recitations come from the [AlQuran.cloud](https://alquran.cloud/cdn) audio CDN. The **About** page,
linked at the bottom of every page, lists the source, credit and licence of every text, translation, tafsir and
recitation.

## On a phone

On wide screens the surah list and settings sit beside the surah; on phones they are in a folded panel above it:

<p>
  <img src="docs/screenshots/en/mobile.png" alt="Reading page on a phone, mushaf layout" width="260">
  <img src="docs/screenshots/en/mobile-settings.png" alt="Surah list and settings on a phone" width="260">
</p>

## Feedback and help

Found a mistake, or have an idea? [Open an issue](https://github.com/udienz/quranweb/issues). Thanks to everyone who has
helped: see [CONTRIBUTORS.md](CONTRIBUTORS.md).

You can contribute in several ways:

- Review a community interface translation in a language you speak.
- Improve an existing translation or help add a new interface language.
- Report bugs, suggest features, or contribute code and tests.

The Qur'an itself is never translated through interface contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
contribution process and translation guidelines.

## Licence

The **code** of QuranWeb is free to use, change and share under the [MIT licence](LICENSE), without any warranty. The text of
the Qur'an, the translations, the tafsir and the recitations are **not** covered by it: each keeps the terms of its source,
listed on the About page of the site.

## For developers

Running it locally, Docker, the data sources, the environments and deployment are described in
[docs/development.md](docs/development.md). The project's conventions are in [CLAUDE.md](CLAUDE.md).
