import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s — ShelbyNet" },
  description: "Storage provider monitoring for ShelbyNet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');}catch(e){}` }} />
      </head>
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-12 max-sm:px-4 h-[72px] flex items-center">
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold tracking-tight">ShelbyNet</span>
          <span className="text-[10px] text-text3 uppercase tracking-wider font-mono">Explorer</span>
        </a>
        <nav className="ml-8 flex items-center gap-1 text-sm font-medium max-sm:hidden">
          <a href="/?tab=sp" className="px-3 py-2 text-text2 hover:text-accent transition-colors rounded">SPs</a>
          <a href="/?tab=blobs" className="px-3 py-2 text-text2 hover:text-accent transition-colors rounded">Blobs</a>
          <a href="/?tab=events" className="px-3 py-2 text-text2 hover:text-accent transition-colors rounded">Events</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a href="/api/network-stats" className="text-sm text-text2 hover:text-accent transition-colors font-mono text-xs">API</a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
