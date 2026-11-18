"use client";

import Link from "next/link";
import { useState } from "react";
import { verseHref } from "@/lib/anchors";
import { useI18n } from "@/lib/i18n/client";
import type { SurahMeta } from "@/lib/quran";
import { collectionOf, liveBookmarks, liveCollections, type UserData } from "@/lib/userdata/schema";
import { userDataActions } from "@/lib/userdata/store";

type Filter = { kind: "all" } | { kind: "none" } | { kind: "collection"; id: string };

const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
    active ? "border-primary bg-primary text-white dark:text-[hsl(192_64%_8%)]" : "border-border hover:bg-background"
  }`;
const button = "rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-background";

/** Bookmarks with their collections: filter, create, rename and delete collections, move a bookmark. */
export default function BookmarkList({ data, meta }: { data: UserData; meta: (n: number) => SurahMeta | undefined }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collections = liveCollections(data);
  const bookmarks = liveBookmarks(data).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // A filter on a collection that was removed (here or on another device) falls back to "all".
  const active: Filter = filter.kind === "collection" && !collections.some((c) => c.id === filter.id) ? { kind: "all" } : filter;
  const count = (id: string | null) => bookmarks.filter((b) => collectionOf(data, b) === id).length;
  const shown = bookmarks.filter((b) =>
    active.kind === "all" ? true : active.kind === "none" ? collectionOf(data, b) === null : collectionOf(data, b) === active.id,
  );
  const current = active.kind === "collection" ? collections.find((c) => c.id === active.id) : undefined;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const id = userDataActions.createCollection(newName);
      setNewName("");
      setError(null);
      setFilter({ kind: "collection", id });
    } catch {
      setError(t("myReading.bookmarks.collectionLimit"));
    }
  }

  if (bookmarks.length === 0 && collections.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted-foreground">{t("myReading.bookmarks.empty")}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3" role="group" aria-label={t("myReading.bookmarks.collection")}>
        <button type="button" className={chip(active.kind === "all")} aria-pressed={active.kind === "all"} onClick={() => setFilter({ kind: "all" })}>
          {t("myReading.bookmarks.all")} ({bookmarks.length})
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chip(active.kind === "collection" && active.id === c.id)}
            aria-pressed={active.kind === "collection" && active.id === c.id}
            onClick={() => {
              setFilter({ kind: "collection", id: c.id });
              setRenaming(null);
              setConfirming(false);
            }}
          >
            {c.name} ({count(c.id)})
          </button>
        ))}
        {collections.length > 0 && (
          <button type="button" className={chip(active.kind === "none")} aria-pressed={active.kind === "none"} onClick={() => setFilter({ kind: "none" })}>
            {t("myReading.bookmarks.none")} ({count(null)})
          </button>
        )}
        <form onSubmit={add} className="flex items-center gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
            placeholder={t("myReading.bookmarks.newCollection")}
            aria-label={t("myReading.bookmarks.collectionName")}
            className="w-36 rounded-full border border-border bg-background px-3 py-1 text-xs"
          />
          <button type="submit" className={button} disabled={!newName.trim()}>
            {t("myReading.bookmarks.add")}
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="px-5 pt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {current && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2 text-xs">
          {renaming !== null ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                userDataActions.renameCollection(current.id, renaming);
                setRenaming(null);
              }}
            >
              <input
                value={renaming}
                onChange={(e) => setRenaming(e.target.value)}
                maxLength={40}
                aria-label={t("myReading.bookmarks.collectionName")}
                className="w-40 rounded-full border border-border bg-background px-3 py-1"
                autoFocus
              />
              <button type="submit" className={button} disabled={!renaming.trim()}>
                {t("myReading.bookmarks.save")}
              </button>
              <button type="button" className={button} onClick={() => setRenaming(null)}>
                {t("myReading.bookmarks.cancel")}
              </button>
            </form>
          ) : confirming ? (
            <>
              <span>{t("myReading.bookmarks.deleteConfirm", { name: current.name })}</span>
              <button
                type="button"
                className="rounded-full bg-red-600 px-3 py-1 font-semibold text-white"
                onClick={() => {
                  userDataActions.removeCollection(current.id);
                  setConfirming(false);
                  setFilter({ kind: "all" });
                }}
              >
                {t("myReading.bookmarks.confirmDelete")}
              </button>
              <button type="button" className={button} onClick={() => setConfirming(false)}>
                {t("myReading.bookmarks.cancel")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={button} onClick={() => setRenaming(current.name)}>
                {t("myReading.bookmarks.rename")}
              </button>
              <button type="button" className={`${button} text-red-600`} onClick={() => setConfirming(true)}>
                {t("myReading.bookmarks.deleteCollection")}
              </button>
            </>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {bookmarks.length === 0 ? t("myReading.bookmarks.empty") : t("myReading.bookmarks.emptyCollection")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((b) => {
            const s = meta(b.surah);
            const label = `${s?.name.latin ?? t("myReading.bookmarks.unknownSurah", { number: b.surah })} ${b.surah}:${b.verse}`;
            return (
              <li key={`${b.surah}:${b.verse}`} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-3">
                <Link href={verseHref(b.surah, b.verse)} className="min-w-0 flex-1">
                  <span className="block font-medium">{label}</span>
                  {b.note && <span className="block whitespace-pre-line text-sm text-muted-foreground">{b.note}</span>}
                </Link>
                {collections.length > 0 && (
                  <select
                    value={collectionOf(data, b) ?? ""}
                    onChange={(e) => userDataActions.setBookmarkCollection(b.surah, b.verse, e.target.value || null)}
                    aria-label={`${t("myReading.bookmarks.collection")}: ${label}`}
                    className="max-w-[10rem] rounded-full border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">{t("myReading.bookmarks.none")}</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
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
    </div>
  );
}
