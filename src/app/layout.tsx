import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s — ShelbyNet" },
  description: "Storage provider monitoring for ShelbyNet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{background:"var(--bg)",color:"var(--text)",fontFamily:"var(--font)"}} className="antialiased min-h-screen flex flex-col">
        <header style={{borderBottom:"1px solid var(--border)"}} className="sticky top-0 z-50 bg-[var(--bg)]">
          <div className="max-w-[1200px] mx-auto px-5 h-12 flex items-center justify-between">
            <a href="/" className="flex items-baseline gap-2">
              <span style={{fontWeight:600,fontSize:15}}>ShelbyNet</span>
              <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)",letterSpacing:".05em"}}>EXPLORER</span>
            </a>
            <a href="https://github.com/CryptoOrange-team/shelby-explorer" style={{fontSize:12,color:"var(--text2)"}} className="hover:text-white transition-colors">GitHub</a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer style={{borderTop:"1px solid var(--border)",color:"var(--text3)",fontFamily:"var(--font-mono)",fontSize:10}} className="py-3 text-center">
          shelbynet graphql &middot; shelby-explorer
        </footer>
      </body>
    </html>
  );
}
