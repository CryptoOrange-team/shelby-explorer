"use client";

import { useEffect } from "react";

const TAB_KEYS = ["sp", "blobs", "events", "price", "dev"] as const;

export function KeyboardShortcuts({ currentTab }: { currentTab: string }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // / → focus search
      if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[name="search"]');
        input?.focus();
        return;
      }

      // 1-5 → switch tabs
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        const tab = TAB_KEYS[num - 1];
        if (tab !== currentTab) {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", tab);
          window.location.href = url.toString();
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentTab]);

  return null;
}
