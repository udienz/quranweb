"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface Prefs {
  arabic: boolean;
  transliteration: boolean;
  translation: boolean;
}

const DEFAULTS: Prefs = { arabic: true, transliteration: true, translation: true };
const KEY = "reading-prefs";

const PrefsContext = createContext<{
  prefs: Prefs;
  toggle: (k: keyof Prefs) => void;
}>({ prefs: DEFAULTS, toggle: () => {} });

export function usePrefs() {
  return useContext(PrefsContext);
}

export default function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // Read the saved preferences after mount so the server and client HTML match.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Earlier versions saved the keys as arab, latin and terjemahan.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs({
          arabic: parsed.arabic ?? parsed.arab ?? true,
          transliteration: parsed.transliteration ?? parsed.latin ?? true,
          translation: parsed.translation ?? parsed.terjemahan ?? true,
        });
      }
    } catch {}
  }, []);

  function toggle(k: keyof Prefs) {
    setPrefs((p) => {
      const next = { ...p, [k]: !p[k] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return <PrefsContext.Provider value={{ prefs, toggle }}>{children}</PrefsContext.Provider>;
}
