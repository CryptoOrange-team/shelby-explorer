import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer" };

function fmtB(b: number): string {
  if (!b) return "0"; const u=["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(i>0?1:0)} ${u[i]}`;
}
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,6)}...${a.slice(-4)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,36)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

const TABS = [
  { k: "sp", l: "Storage Providers" },
  { k: "blobs", l: "Blobs" },
  { k: "events", l: "Events" },
  { k: "price", l: "Cost" },
  { k: "dev", l: "Developers" },
] as const;

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ sort?: string; search?: string; tab?: string }> }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "active", search = sp.search ?? "", tab = sp.tab ?? "sp";
  const d = await getShelbyData(sort, search);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6">
      <AutoRefresh interval={30} />

      {/* Stats bar */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-5">
        <div className="flex items-baseline gap-4">
          <Metric label="Blobs" value={fmtN(d.blobCount)} />
          <Metric label="Storage" value={fmtB(d.totalSize)} />
          <Metric label="Operations" value={fmtN(d.activityCount)} />
          <Metric label="SPs" value={`${d.activeSPs}/${d.totalSPs}`} sub="active/total" />
        </div>
        <div className="ml-auto flex items-baseline gap-4 text-[11px] text-text-muted font-mono">
          <span>24h +{fmtN(d.growth.dayBlobs)}</span>
          <span>7d +{fmtN(d.growth.weekBlobs)}</span>
        </div>
      </div>

      {d.error && <div className="mb-5 p-3 border border-red/20 bg-red-soft text-[13px] text-red font-mono">{d.error}</div>}

      {/* Tabs */}
      <nav className="flex gap-0 mb-5 border-b border-border" role="tablist">
        {TABS.map(t => (
          <a key={t.k} href={`?tab=${t.k}&sort=${sort}`} role="tab" aria-selected={tab === t.k}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${tab === t.k ? "border-accent text-text" : "border-transparent text-text-secondary hover:text-text hover:border-border-light"}`}>
            {t.l}
          </a>
        ))}
        <a href="/tools/sp-explorer/map" className="px-4 py-2.5 text-[13px] font-medium border-b-2 border-transparent text-text-secondary hover:text-text -mb-[1px]">Map</a>
        <a href="/api/network-stats" className="px-4 py-2.5 text-[13px] font-medium border-b-2 border-transparent text-text-muted hover:text-text-secondary -mb-[1px] font-mono">JSON</a>
      </nav>

      {/* Toolbar */}
      {tab !== "dev" && tab !== "price" && (
        <div className="flex gap-2 mb-4">
          <form className="flex-1 flex gap-2" role="search">
            <label htmlFor="search-input" className="sr-only">Search {tab === "blobs" ? "blob name" : "SP address"}</label>
            <input id="search-input" name="search" defaultValue={search}
              placeholder={tab === "blobs" ? "blob name…" : "0x…"}
              className="flex-1 max-w-md px-3 py-2 text-[13px] border border-border bg-surface text-text placeholder:text-text-muted focus:border-accent font-mono" />
            <input type="hidden" name="tab" value={tab} />
            <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-accent text-black hover:bg-accent-hover transition-colors">Search</button>
            {search && <a href={`?tab=${tab}&sort=${sort}`} className="px-3 py-2 text-[13px] border border-border text-text-secondary hover:text-text transition-colors">Clear</a>}
          </form>
          <div className="flex gap-1">
            {tab === "sp" && <>
              <SortLink active={sort === "active" && !search} href={`?tab=sp&sort=active`}>Active</SortLink>
              <SortLink active={sort === "total" && !search} href={`?tab=sp&sort=total`}>Total</SortLink>
            </>}
            <a href="/api/export-sp" className="px-3 py-2 text-[11px] font-mono border border-border text-text-secondary hover:text-text transition-colors">CSV</a>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === "sp" && <SPTable nodes={d.nodes} />}
      {tab === "blobs" && <BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs} />}
      {tab === "events" && <EventsTable events={d.events} />}
      {tab === "price" && <PriceSection totalSize={d.totalSize} growth={d.growth} />}
      {tab === "dev" && <DevSection />}

      <p className="mt-12 text-[10px] text-text-muted font-mono text-right">ShelbyNet GraphQL · {new Date().toISOString()}</p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[15px] font-bold tabular-nums">{value}</span>
      {sub && <span className="text-[10px] text-text-muted font-mono">{sub}</span>}
    </div>
  );
}

function SortLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <a href={href} className={`px-3 py-2 text-[11px] font-mono border transition-colors ${active ? "border-accent text-accent" : "border-border text-text-secondary hover:text-text"}`}>
      {children}
    </a>
  );
}

// ── SP Table ──
function SPTable({ nodes }: { nodes: { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number }[] }) {
  if (nodes.length === 0) return <div className="py-20 text-center text-text-muted text-[13px]">No storage providers found.</div>;

  return (
    <div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-[13px]" role="grid">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-text-muted text-[11px] font-mono uppercase tracking-wider">
              <th className="py-2.5 pl-4 pr-3 font-medium w-[160px]" scope="col">Address</th>
              <th className="py-2.5 px-3 font-medium text-right w-[72px]" scope="col">Active</th>
              <th className="py-2.5 px-3 font-medium text-right w-[60px]" scope="col">Join</th>
              <th className="py-2.5 px-3 font-medium text-right w-[72px]" scope="col">Vacated</th>
              <th className="py-2.5 px-3 font-medium hidden md:table-cell" scope="col">Active Rate</th>
              <th className="py-2.5 px-3 font-medium text-right w-[68px]" scope="col">Health</th>
              <th className="py-2.5 pr-4 pl-3 font-medium text-right w-[72px]" scope="col">Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {nodes.map(sp => {
              const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
              const hoursAgo = sp.lastSeen ? (Date.now() - sp.lastSeen / 1000) / 3600000 : 999;
              const health = Math.round(pct * 0.6 + Math.max(0, 100 - hoursAgo * 10) * 0.4);
              const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
              const recent = sp.lastSeen && (Date.now() - sp.lastSeen / 1000) < 600_000;
              return (
                <tr key={sp.address} className="hover:bg-surface-alt transition-colors">
                  <td className="py-2 pl-4 pr-3">
                    <div className="flex items-center gap-2">
                      {recent && <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" title="Active <10 min" />}
                      <Link href={`/tools/sp-explorer/${sp.address}`} className="font-mono text-[12px] text-text hover:text-accent transition-colors" title={sp.address}>
                        {short(sp.address)}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-mono text-green text-right font-medium tabular-nums">{sp.activeSlots}</td>
                  <td className="py-2 px-3 font-mono text-yellow text-right tabular-nums">{sp.joiningSlots || "—"}</td>
                  <td className="py-2 px-3 font-mono text-red text-right tabular-nums">{sp.vacatedSlots || "—"}</td>
                  <td className="py-2 px-3 hidden md:table-cell">
                    <div className="flex items-center gap-2 max-w-[160px]">
                      <div className="flex-1 h-1.5 bg-border"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                      <span className="font-mono text-[11px] text-text-secondary tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right"><span className={`font-mono text-[12px] font-semibold tabular-nums ${hc}`}>{health}</span></td>
                  <td className="py-2 pr-4 pl-3 font-mono text-[11px] text-text-muted text-right tabular-nums">{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-text-muted font-mono">{nodes.length} storage provider{nodes.length > 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Blobs ──
function BlobSection({ topBlobs, recentBlobs }: {
  topBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  recentBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-3">Recent uploads · {recentBlobs.length} blobs</h2>
        <BlobTable blobs={recentBlobs} showTime />
      </div>
      <div>
        <h2 className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-3">Largest blobs · {topBlobs.length} blobs</h2>
        <BlobTable blobs={topBlobs} />
      </div>
    </div>
  );
}

function BlobTable({ blobs, showTime }: {
  blobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  showTime?: boolean;
}) {
  if (!blobs?.length) return <div className="py-16 text-center text-text-muted text-[13px] border border-border">No blobs found.</div>;

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-text-muted text-[11px] font-mono uppercase tracking-wider">
            <th className="py-2.5 pl-4 pr-3 w-8" scope="col">#</th>
            <th className="py-2.5 px-3" scope="col">Name</th>
            <th className="py-2.5 px-3 text-right w-[100px]" scope="col">Size</th>
            <th className="py-2.5 px-3 w-[72px]" scope="col">Status</th>
            <th className="py-2.5 px-3 hidden lg:table-cell" scope="col">Owner</th>
            <th className="py-2.5 px-3 text-right w-[72px]" scope="col">Chunks</th>
            {showTime && <th className="py-2.5 pr-4 pl-3 text-right w-[72px]" scope="col">Age</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {blobs.map((b, i) => {
            const deleted = b.isDeleted;
            const writing = b.isWritten === false;
            const expiring = b.expires && parseInt(b.expires, 10) < Date.now() * 1000 + 86400_000_000;
            const status = deleted ? "del" : writing ? "wip" : expiring ? "exp" : "ok";
            const sc = deleted ? "text-red" : writing || expiring ? "text-yellow" : "text-green";
            return (
              <tr key={i} className="hover:bg-surface-alt transition-colors">
                <td className="py-2 pl-4 pr-3 font-mono text-text-muted tabular-nums">{i + 1}</td>
                <td className="py-2 px-3 max-w-[300px] truncate" title={b.name}>
                  <Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="text-text hover:text-accent transition-colors">
                    {shortName(b.name)}
                  </Link>
                </td>
                <td className="py-2 px-3 font-mono text-accent text-right tabular-nums font-medium">{fmtB(b.size)}</td>
                <td className="py-2 px-3"><span className={`font-mono text-[11px] font-medium ${sc}`}>{status}</span></td>
                <td className="py-2 px-3 hidden lg:table-cell">
                  <Link href={`/tools/sp-explorer/owner/${b.owner}`} className="font-mono text-[12px] text-text-secondary hover:text-accent transition-colors">{short(b.owner)}</Link>
                </td>
                <td className="py-2 px-3 font-mono text-text-muted text-right tabular-nums">{b.chunksets}</td>
                {showTime && <td className="py-2 pr-4 pl-3 font-mono text-[11px] text-text-muted text-right tabular-nums">{ago(parseInt(b.created, 10) / 1000)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Events ──
function EventsTable({ events }: { events: { name: string; owner: string; type: string; time: string; hash?: string }[] }) {
  if (!events?.length) return <div className="py-20 text-center text-text-muted text-[13px] border border-border">No recent events.</div>;

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-text-muted text-[11px] font-mono uppercase tracking-wider">
            <th className="py-2.5 pl-4 pr-3 w-[120px]" scope="col">Type</th>
            <th className="py-2.5 px-3" scope="col">Blob</th>
            <th className="py-2.5 px-3 hidden lg:table-cell" scope="col">Owner</th>
            <th className="py-2.5 pr-4 pl-3 text-right w-[180px]" scope="col">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((e, i) => (
            <tr key={i} className="hover:bg-surface-alt transition-colors">
              <td className="py-2 pl-4 pr-3 font-mono text-[11px] text-text-muted">{e.type || "—"}</td>
              <td className="py-2 px-3 max-w-[350px] truncate" title={e.name}>
                <Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} className="text-text hover:text-accent transition-colors">{shortName(e.name)}</Link>
              </td>
              <td className="py-2 px-3 hidden lg:table-cell">
                <Link href={`/tools/sp-explorer/owner/${e.owner}`} className="font-mono text-[12px] text-text-secondary hover:text-accent transition-colors">{short(e.owner)}</Link>
              </td>
              <td className="py-2 pr-4 pl-3 font-mono text-[11px] text-text-muted text-right tabular-nums">{e.time ? new Date(e.time).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Price ──
function PriceSection({ totalSize, growth }: { totalSize: number; growth: { weekBlobs: number; weekSize: number; dayBlobs: number; daySize: number } }) {
  const gb = totalSize > 0 ? totalSize / (1024 ** 3) : 0;
  const shelby = gb * 0.01, aws = gb * 0.073;
  const savings = aws > 0 ? Math.round((1 - shelby / aws) * 100) : 70;
  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <PriceCard label="AWS S3" value={`$${aws.toFixed(0)}`} sub="$0.023 + $0.05/GB" />
        <PriceCard label="Shelby" value={`$${shelby.toFixed(0)}`} sub="$0.01 + $0.014/GB" accent />
        <PriceCard label="Savings" value={`~${savings}%`} sub={`${fmtB(totalSize)} total`} highlight />
      </div>
      <div className="p-4 border border-border bg-surface text-[13px] text-text-secondary">
        <span className="font-medium text-text">Growth:</span> 7d +{fmtN(growth.weekBlobs)} blobs ({fmtB(growth.weekSize)}) · 24h +{fmtN(growth.dayBlobs)} blobs ({fmtB(growth.daySize)})
      </div>
    </div>
  );
}

function PriceCard({ label, value, sub, accent, highlight }: { label: string; value: string; sub: string; accent?: boolean; highlight?: boolean }) {
  return (
    <div className={`p-5 border text-center ${highlight ? "border-accent/30 bg-accent/[0.04]" : "border-border bg-surface"}`}>
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono tabular-nums ${accent ? "text-green" : highlight ? "text-accent" : "text-red"}`}>{value}</div>
      <div className="text-[10px] text-text-muted mt-1">{sub}</div>
    </div>
  );
}

// ── Dev ──
function DevSection() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { n: "docs.shelby.xyz", h: "https://docs.shelby.xyz" },
          { n: "github.com/shelby", h: "https://github.com/shelby/examples" },
          { n: "developers.shelby.xyz", h: "https://developers.shelby.xyz" },
          { n: "discord.gg/shelbyserves", h: "https://discord.gg/shelbyserves" },
        ].map(l => (
          <a key={l.h} href={l.h} target="_blank" rel="noopener noreferrer" className="p-4 border border-border bg-surface hover:border-border-light transition-colors text-[13px]">
            <span className="font-medium text-text">{l.n}</span>
          </a>
        ))}
      </div>
      <div className="border border-border bg-surface p-5">
        <h2 className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-3">API</h2>
        <p className="text-[13px] text-text-secondary mb-2">Programmatic access to all network data.</p>
        <code className="block font-mono text-[13px] text-accent bg-surface-alt px-3 py-2 select-all">GET /api/network-stats</code>
        <a href="/api/network-stats" target="_blank" className="inline-block mt-2 text-[11px] font-mono text-text-muted hover:text-text-secondary transition-colors">Open →</a>
      </div>
    </div>
  );
}
