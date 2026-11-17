"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface Prefs {
  arab: boolean;
  latin: boolean;
  terjemahan: boolean;
}

const DEFAULTS: Prefs = { arab: true, latin: true, terjemahan: true };
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

  // Baca preferensi tersimpan setelah mount supaya HTML server dan client sama.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setPrefs({ ...DEFAULTS, ...JSON.parse(saved) });
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
