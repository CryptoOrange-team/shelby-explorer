import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s — ShelbyNet" },
  description: "Storage provider monitoring for ShelbyNet. Real-time SP health, blob browser, live events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');}catch(e){}` }} />
      </head>
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-text-muted">
          ShelbyNet Explorer · Data from ShelbyNet GraphQL · <a href="https://shelbycn.com" className="hover:text-text-secondary transition-colors">shelbycn.com</a>
        </footer>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between">
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">ShelbyNet</span>
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Explorer</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="https://github.com/CryptoOrange-team/shelby-explorer" className="font-mono text-[11px] text-text-muted hover:text-text transition-colors">GitHub</a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
