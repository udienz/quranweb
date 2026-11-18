"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AccountSection from "@/components/AccountSection";
import { verseHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import type { StringKey } from "@/lib/i18n/messages";
import type { SurahMeta } from "@/lib/quran";
import { exportUserData, liveBookmarks, liveProgress, UserDataError, type UserDataErrorCode } from "@/lib/userdata/schema";
import { userDataActions, useUserData } from "@/lib/userdata/store";

const ERROR_MESSAGES: Record<UserDataErrorCode, StringKey> = {
  "not-json": "myReading.backup.errors.notJson",
  "not-backup": "myReading.backup.errors.notBackup",
  "unsupported-version": "myReading.backup.errors.unsupportedVersion",
  invalid: "myReading.backup.errors.invalid",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-card">
      <h2 className="border-b border-border px-5 py-3 font-display font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="px-5 py-6 text-sm text-muted-foreground">{children}</p>
);

export default function MyReading({ surahs, accounts }: { surahs: SurahMeta[]; accounts: boolean }) {
  const { t, date } = useI18n();
  const data = useUserData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const meta = (n: number) => surahs.find((s) => s.number === n);

  const progress = liveProgress(data);
  const bookmarks = liveBookmarks(data).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const last = data.lastRead && meta(data.lastRead.surah);

  function download() {
    const blob = new Blob([exportUserData(userDataActions.current(), new Date().toISOString())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quranweb-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking the URL too early can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      userDataActions.importMerge(await file.text());
      setMessage({ ok: true, text: t("myReading.backup.imported") });
    } catch (err) {
      const key = err instanceof UserDataError ? ERROR_MESSAGES[err.code] : "myReading.backup.readFailed";
      setMessage({ ok: false, text: t(key) });
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      <Section title={t("myReading.lastRead.title")}>
        {data.lastRead && last ? (
          <Link href={verseHref(data.lastRead.surah, data.lastRead.verse)} className="flex items-center justify-between px-5 py-4 hover:bg-muted">
            <span>
              <span className="block font-semibold">
                {t("continueReading.position", { surah: last.name.latin, verse: data.lastRead.verse })}
              </span>
              <span className="text-xs text-muted-foreground">{date(data.lastRead.at)}</span>
            </span>
            <span className="text-sm font-medium text-primary">{t("myReading.lastRead.resume")} &rarr;</span>
          </Link>
        ) : (
          <Empty>{t("myReading.lastRead.empty")}</Empty>
        )}
      </Section>

      <Section title={t("myReading.progress.title")}>
        {progress.length === 0 ? (
          <Empty>{t("myReading.progress.empty")}</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {progress.map((p) => {
              const s = meta(p.surah);
              if (!s) return null;
              const percent = Math.min(100, Math.round((p.readUpTo / s.verseCount) * 100));
              return (
                <li key={p.surah} className="flex items-center gap-4 px-5 py-3">
                  <Link href={verseHref(p.surah, p.readUpTo)} className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name.latin}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("myReading.progress.detail", { read: p.readUpTo, total: s.verseCount, percent })}
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => userDataActions.clearProgress(p.surah)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("myReading.progress.remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t("myReading.bookmarks.title")}>
        {bookmarks.length === 0 ? (
          <Empty>{t("myReading.bookmarks.empty")}</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {bookmarks.map((b) => {
              const s = meta(b.surah);
              return (
                <li key={`${b.surah}:${b.verse}`} className="flex items-start gap-4 px-5 py-3">
                  <Link href={verseHref(b.surah, b.verse)} className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {s?.name.latin ?? t("myReading.bookmarks.unknownSurah", { number: b.surah })} {b.surah}:{b.verse}
                    </span>
                    {b.note && <span className="block whitespace-pre-line text-sm text-muted-foreground">{b.note}</span>}
                  </Link>
                  <button
                    type="button"
                    onClick={() => userDataActions.removeBookmark(b.surah, b.verse)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("myReading.bookmarks.remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t("myReading.backup.title")}>
        <div className="px-5 py-4 text-sm">
          <p className="mb-3 text-muted-foreground">{t("myReading.backup.description")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={download}
              className="rounded-full bg-primary px-5 py-2 font-medium text-white hover:opacity-90 dark:text-[hsl(192_64%_8%)]"
            >
              {t("myReading.backup.download")}
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-border px-5 py-2 font-medium hover:bg-muted"
            >
              {t("myReading.backup.import")}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </div>
          {message && (
            <p role="status" className={`mt-3 ${message.ok ? "text-primary" : "text-red-600 dark:text-red-400"}`}>
              {message.text}
            </p>
          )}
        </div>
      </Section>
      {accounts && <AccountSection />}
    </div>
  );
}
