"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const h = document.documentElement;
    const next = !h.classList.contains("dark");
    h.classList.toggle("dark", next);
    setDark(next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch (_) { /* noop */ }
  }

  return (
    <button aria-label="切换主题" onClick={toggle}
      className="p-2 text-text3 hover:text-text rounded transition-colors text-sm">
      {dark ? "☀" : "☾"}
    </button>
  );
}
