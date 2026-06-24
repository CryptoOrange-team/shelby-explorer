"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  function toggle() {
    const h = document.documentElement;
    const next = !h.classList.contains("dark");
    h.classList.toggle("dark", next);
    setDark(next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch (_) {}
  }

  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="p-1.5 text-text-muted hover:text-text transition-colors text-[15px] leading-none">
      {dark ? "☀" : "☾"}
    </button>
  );
}
