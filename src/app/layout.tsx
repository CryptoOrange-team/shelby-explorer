import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShelbyNet Explorer", template: "%s — ShelbyNet" },
  description: "Storage provider monitoring for the Shelby decentralized hot storage network.",
};

const nav = [
  { href: "/?tab=sp", label: "Providers" },
  { href: "/?tab=blobs", label: "Blobs" },
  { href: "/?tab=events", label: "Events" },
  { href: "/?tab=price", label: "Cost" },
  { href: "/?tab=dev", label: "Developers" },
  { href: "/tools/sp-explorer/map", label: "Map" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-bg/95">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
            <a href="/" className="text-base font-bold tracking-tight shrink-0">
              ShelbyNet <span className="text-text3 font-normal text-sm">Explorer</span>
            </a>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map(l => (
                <a key={l.href} href={l.href} className="px-3 py-1.5 text-text2 hover:text-text transition-colors rounded-md">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="ml-auto">
              <a href="/api/network-stats" className="text-xs text-text3 hover:text-text transition-colors font-mono">API</a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-8 text-center text-xs text-text3">
          ShelbyNet data via GraphQL indexer &middot; Community project
        </footer>
      </body>
    </html>
  );
}
