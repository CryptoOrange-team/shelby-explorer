"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <button onClick={copy} className="font-mono text-text3 hover:text-accent transition-colors text-xs" title={`copy ${text}`}>
      {copied ? "copied" : label}
    </button>
  );
}
