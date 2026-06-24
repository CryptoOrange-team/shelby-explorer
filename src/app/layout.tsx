import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s — ShelbyNet" },
  description: "Storage provider monitoring for ShelbyNet. SP health, blob browser, live events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-3 text-center text-[12px] text-[var(--text3)]">
          ShelbyNet Explorer · Data from ShelbyNet GraphQL
        </footer>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between">
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--text)]">ShelbyNet</span>
          <span className="text-[11px] text-[var(--text3)] uppercase tracking-wider" style={{fontFamily:"var(--font-mono)"}}>Explorer</span>
        </a>
        <a href="https://github.com/CryptoOrange-team/shelby-explorer" className="text-[13px] text-[var(--text2)] hover:text-[var(--accent)] transition-colors">GitHub</a>
      </div>
    </header>
  );
}
