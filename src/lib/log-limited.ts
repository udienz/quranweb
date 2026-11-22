// A message that repeats on every request is logged once in a while, so one real error does not drown in it.

const lastLogged = new Map<string, number>();

/** Whether a message with this key may be logged now: at most once per `everyMs`. Remembers the time when it says yes. */
export function mayLog(key: string, now: number, everyMs: number): boolean {
  const last = lastLogged.get(key);
  if (last !== undefined && now - last < everyMs) return false;
  lastLogged.set(key, now);
  return true;
}

/** `console.error`, but a message with the same key is logged at most once an hour. */
export function errorOncePerHour(key: string, ...args: unknown[]): void {
  if (mayLog(key, Date.now(), 60 * 60 * 1000)) console.error(...args);
}
