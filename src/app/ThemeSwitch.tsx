"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Landing-only theme switch: same storage key as the app's toggle, without pulling in the app shell. */
export function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sello-theme", next); } catch {}
    setDark(!dark);
  };
  return (
    <button type="button" onClick={toggle} aria-label="تغییر تم" className="size-10 grid place-items-center rounded-control text-fg hover:bg-subtle cursor-pointer">
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
