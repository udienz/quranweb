/** Write a browser cookie for one year. Browser only (call it from event handlers). */
export function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
