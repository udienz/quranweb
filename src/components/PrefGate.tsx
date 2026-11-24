"use client";

import { usePrefs, type Prefs } from "./PrefsProvider";

/** Shows its children only while a display toggle is on, for server pages that show a part the reader can hide. */
export default function PrefGate({ pref, children }: { pref: keyof Prefs; children: React.ReactNode }) {
  const { prefs } = usePrefs();
  return prefs[pref] ? <>{children}</> : null;
}
