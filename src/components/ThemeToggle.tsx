"use client";

export function ThemeToggle() {
  function toggle() {
    const h = document.documentElement;
    const next = !h.classList.contains("dark");
    h.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch (_) {}
  }

  return (
    <button onClick={toggle}
      className="w-10 h-10 rounded-full bg-surface border border-border shadow-sm flex items-center justify-center text-text2 hover:text-text transition-colors text-sm"
      aria-label="Toggle theme">
      <span className="dark:hidden">☾</span>
      <span className="hidden dark:inline">☀</span>
    </button>
  );
}
