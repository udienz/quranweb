// The surah of the day on the home page: one of the 114, in turn, changing at midnight in Indonesia (Asia/Jakarta, UTC+7,
// no daylight saving). The order is not the mushaf order (Al-Baqarah would follow Al-Fatihah every cycle): the day number
// times 53, modulo 114. 53 and 114 share no factor, so each surah comes once in every 114 days.

export const SURAH_COUNT = 114;
const STEP = 53;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's surah, read from the clock (call it at request time). */
export const todaysSurah = (): number => dailySurah(Date.now());

/** The surah number (1 to 114) for the day that `now` falls on in Jakarta. */
export function dailySurah(now: number): number {
  const day = Math.floor((now + JAKARTA_OFFSET_MS) / DAY_MS);
  return ((((day * STEP) % SURAH_COUNT) + SURAH_COUNT) % SURAH_COUNT) + 1;
}
