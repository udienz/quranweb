"use client";

import { useI18n } from "@/lib/i18n/client";
import { goalStreak, localDay, pagesForVerses, TOTAL_VERSES, versesReadInTotal, versesReadOn, type UserData } from "@/lib/userdata/schema";
import { userDataActions } from "@/lib/userdata/store";

const PRESETS = [5, 10, 20, 50, 100];
/** 20 pages is a juz a day. */
const PAGE_PRESETS = [1, 2, 5, 10, 20];

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** The daily goal in verses, today's progress, the streak and the progress towards a khatam. */
export default function DailyGoal({ data }: { data: UserData }) {
  const { t, tn, locale } = useI18n();
  const goal = data.goal?.versesPerDay ?? 0;
  const pages = data.goal?.pages ?? 0;
  const selected = goal === 0 ? "off" : pages > 0 ? `p${pages}` : `v${goal}`;
  const today = localDay(new Date());
  const done = versesReadOn(data, today);
  const todayText =
    pages > 0
      ? t("myReading.goal.todayPages", { done: Math.min(pagesForVerses(done), 9999).toLocaleString(locale === "id" ? "id-ID" : "en-US"), goal: pages })
      : t("myReading.goal.today", { done, goal });
  const streak = goalStreak(data, today);
  const total = versesReadInTotal(data);
  const remaining = TOTAL_VERSES - total;
  const percent = (Math.floor((total / TOTAL_VERSES) * 1000) / 10).toLocaleString(locale === "id" ? "id-ID" : "en-US");

  return (
    <div className="space-y-4 px-5 py-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="daily-goal" className="font-medium">
          {t("myReading.goal.title")}
        </label>
        <select
          id="daily-goal"
          value={selected}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "off") userDataActions.setDailyGoal(0);
            else if (v.startsWith("p")) userDataActions.setDailyGoalInPages(Number(v.slice(1)));
            else userDataActions.setDailyGoal(Number(v.slice(1)));
          }}
          className="rounded-full border border-border bg-background px-3 py-1"
        >
          <option value="off">{t("myReading.goal.off")}</option>
          {[...new Set([...PRESETS, ...(goal > 0 && pages === 0 ? [goal] : [])])]
            .sort((a, b) => a - b)
            .map((n) => (
              <option key={`v${n}`} value={`v${n}`}>
                {tn("myReading.goal.perDay", n)}
              </option>
            ))}
          {[...new Set([...PAGE_PRESETS, ...(pages > 0 ? [pages] : [])])]
            .sort((a, b) => a - b)
            .map((n) => (
              <option key={`p${n}`} value={`p${n}`}>
                {tn("myReading.goal.perDayPages", n)}
              </option>
            ))}
        </select>
      </div>

      {goal === 0 ? (
        <p className="text-muted-foreground">{t("myReading.goal.intro")}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">{todayText}</span>
            {done >= goal ? (
              <span className="font-medium text-primary">{t("myReading.goal.reached")}</span>
            ) : null}
          </div>
          <Bar value={done} max={goal} label={todayText} />
          {streak > 0 && <p className="text-muted-foreground">{tn("myReading.goal.streak", streak)}</p>}
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <span className="block font-medium">{t("myReading.goal.khatam")}</span>
        <Bar value={total} max={TOTAL_VERSES} label={t("myReading.goal.khatam")} />
        <p className="text-muted-foreground">
          {t("myReading.goal.khatamDetail", { done: total, total: TOTAL_VERSES, percent })}
          {remaining === 0
            ? ` ${t("myReading.goal.done")}`
            : goal > 0
              ? `. ${tn("myReading.goal.estimate", Math.ceil(remaining / goal))}.`
              : ""}
        </p>
      </div>
    </div>
  );
}
