import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Analytics", template: "%s — ShelbyNet" },
  description: "Analytics layer for ShelbyNet. SP health monitoring, network growth, cost comparison.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-bg/95">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="text-base font-bold tracking-tight">ShelbyNet <span className="text-text3 font-normal text-sm">Analytics</span></a>
            <div className="flex items-center gap-3 text-sm">
              <a href="https://explorer.shelby.xyz/testnet" target="_blank" rel="noopener noreferrer" className="text-text2 hover:text-text transition-colors">Official Explorer ↗</a>
              <a href="https://github.com/CryptoOrange-team/shelby-explorer" className="text-text3 hover:text-text transition-colors font-mono text-xs">GitHub</a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-text3">
          ShelbyNet Analytics · Data from GraphQL Indexer
        </footer>
      </body>
    </html>
  );
}
