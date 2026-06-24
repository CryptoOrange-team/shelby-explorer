import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s · ShelbyNet" },
  description: "Real-time ShelbyNet network explorer. SP nodes, blob leaderboard, live events, cost comparison.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          try { var t=localStorage.getItem('theme'); if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)) document.documentElement.classList.add('dark'); } catch(e) {}
        `}} />
      </head>
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-5 h-[52px] flex items-center justify-between">
            <a href="/" className="font-extrabold text-lg tracking-tight">ShelbyNet<span className="text-accent"> Explorer</span></a>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="https://shelbycn.com" className="text-xs text-text3 hover:text-text transition-colors font-mono">shelbycn.com →</a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border mt-16 py-6 text-center font-mono text-[10px] text-text3">
          ShelbyNet Explorer · Data from GraphQL Indexer · <a href="https://shelbycn.com" className="hover:text-text transition-colors">shelbycn.com</a>
        </footer>
      </body>
    </html>
  );
}
