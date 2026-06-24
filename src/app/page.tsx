import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,5)}...${a.slice(-3)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,36)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ sort?: string; search?: string; tab?: string }> }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "active", search = sp.search ?? "", tab = sp.tab ?? "sp";
  const d = await getShelbyData(sort, search);

  return (
    <div>
      {/* Hero gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-hero-light pointer-events-none" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-12 max-sm:px-4 pt-20 pb-12">
          <h1 className="text-center text-4xl font-extrabold max-sm:text-2xl">ShelbyNet Explorer</h1>

          {/* Pill search */}
          <div className="relative max-w-[730px] mx-auto mt-8" style={{ height: 56 }}>
            <form className="relative h-full">
              <input name="search" defaultValue={search}
                placeholder={tab === "blobs" ? "Search by blob name..." : "Search by SP address or blob name..."}
                className="w-full h-full rounded-full bg-surface border border-border shadow-sm backdrop-blur-sm px-6 pr-[140px] text-sm placeholder:text-text3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono dark:border dark:backdrop-blur-[5px]" />
              <input type="hidden" name="tab" value={tab} />
              <button type="submit"
                className="absolute right-1.5 top-1.5 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white h-11 w-[80px] text-sm font-medium transition-colors">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-12 max-sm:px-4 pb-20">
        {d.error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 font-mono text-xs">
            {d.error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1 mb-12">
          <StatCard icon="📦" label="Total Blobs" value={fmtN(d.blobCount)} sub={`24h +${fmtN(d.growth.dayBlobs)}`} />
          <StatCard icon="💾" label="Storage" value={fmtB(d.totalSize)} sub={`7d +${fmtB(d.growth.weekSize)}`} />
          <StatCard icon="⚡" label="Operations" value={fmtN(d.activityCount)} />
          <StatCard icon="🖥" label="Storage Providers" value={`${d.activeSPs}/${d.totalSPs}`} sub={`${d.activeSlots}/${d.totalSlots} active slots`} />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border">
          {[
            { k: "sp", l: "Storage Providers" },
            { k: "blobs", l: "Blobs" },
            { k: "events", l: "Events" },
            { k: "price", l: "Cost" },
            { k: "dev", l: "Developers" },
          ].map(t => (
            <a key={t.k} href={`?tab=${t.k}&sort=${sort}`}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                tab === t.k ? "border-accent text-accent" : "border-transparent text-text2 hover:text-text hover:border-text3"
              }`}>
              {t.l}
            </a>
          ))}
          <a href="/tools/sp-explorer/map" className="px-5 py-3 text-sm font-medium border-b-2 border-transparent text-text2 hover:text-text -mb-[1px]">Map</a>
          <div className="ml-auto flex gap-2 items-center">
            {tab === "sp" && <>
              <a href="?tab=sp&sort=active" className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-mono ${sort === "active" && !search ? "border-accent text-accent bg-accent/5" : "border-border text-text2 hover:text-text"}`}>Active</a>
              <a href="?tab=sp&sort=total" className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-mono ${sort === "total" && !search ? "border-accent text-accent bg-accent/5" : "border-border text-text2 hover:text-text"}`}>Total</a>
            </>}
            <a href="/api/export-sp" className="text-xs px-3 py-1.5 rounded-full border border-border text-text2 hover:text-accent transition-colors font-mono">CSV</a>
          </div>
        </div>

        {/* Content area */}
        {tab === "sp" && <SPTable nodes={d.nodes} />}
        {tab === "blobs" && <BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs} />}
        {tab === "events" && <EventsTable events={d.events} />}
        {tab === "price" && <PriceSection totalSize={d.totalSize} growth={d.growth} />}
        {tab === "dev" && <DevSection />}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-lg">{icon}</span>
        <span className="text-sm text-text2">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
      {sub && <div className="text-xs text-text3 mt-1">{sub}</div>}
    </div>
  );
}

function SPTable({ nodes }: { nodes: { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number }[] }) {
  if (!nodes.length) return <div className="py-20 text-center text-text3 text-sm">No storage providers found.</div>;
  return (
    <div>
      <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-text3 text-xs font-medium uppercase tracking-wider">
              <th className="py-3.5 pl-5 pr-3">Address</th>
              <th className="py-3.5 px-3 text-right w-20">Active</th>
              <th className="py-3.5 px-3 text-right w-16">Join</th>
              <th className="py-3.5 px-3 text-right w-20">Vacated</th>
              <th className="py-3.5 px-3 text-right w-20">Health</th>
              <th className="py-3.5 pr-5 pl-3 text-right w-20">Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {nodes.map(sp => {
              const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
              const hoursAgo = sp.lastSeen ? (Date.now() - sp.lastSeen / 1000) / 3600000 : 999;
              const health = Math.round(pct * .6 + Math.max(0, 100 - hoursAgo * 10) * .4);
              const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
              return (
                <tr key={sp.address} className="hover:bg-accent/[.02] transition-colors">
                  <td className="py-3 pl-5 pr-3">
                    <Link href={`/tools/sp-explorer/${sp.address}`} className="text-accent hover:underline font-mono text-xs">{short(sp.address)}</Link>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-green">{sp.activeSlots}</td>
                  <td className="py-3 px-3 text-right font-mono text-yellow">{sp.joiningSlots || "—"}</td>
                  <td className="py-3 px-3 text-right font-mono text-red">{sp.vacatedSlots || "—"}</td>
                  <td className="py-3 px-3 text-right"><span className={`font-mono text-xs font-semibold ${hc}`}>{health}</span></td>
                  <td className="py-3 pr-5 pl-3 text-right font-mono text-xs text-text3">{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-text3 font-mono">{nodes.length} storage providers</div>
    </div>
  );
}

function BlobSection({ topBlobs, recentBlobs }: {
  topBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  recentBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
}) {
  return <div className="space-y-10">
    <div><h2 className="text-base font-semibold mb-4">Recent Uploads <span className="text-text3 font-normal text-sm">({recentBlobs.length})</span></h2><BlobTable blobs={recentBlobs} showTime /></div>
    <div><h2 className="text-base font-semibold mb-4">Largest Blobs <span className="text-text3 font-normal text-sm">({topBlobs.length})</span></h2><BlobTable blobs={topBlobs} /></div>
  </div>;
}

function BlobTable({ blobs, showTime }: {
  blobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  showTime?: boolean;
}) {
  if (!blobs?.length) return <div className="py-16 text-center text-text3 text-sm">No blobs found.</div>;
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-text3 text-xs font-medium uppercase tracking-wider">
          <th className="py-3.5 pl-5 pr-3 w-8">#</th><th className="py-3.5 px-3">Name</th><th className="py-3.5 px-3 text-right w-24">Size</th><th className="py-3.5 px-3 w-16">St</th>
          <th className="py-3.5 px-3">Owner</th>{showTime && <th className="py-3.5 pr-5 pl-3 text-right w-16">Age</th>}
        </tr></thead>
        <tbody className="divide-y divide-border">
          {blobs.map((b, i) => {
            const d = b.isDeleted, w = b.isWritten === false, e = b.expires && parseInt(b.expires, 10) < Date.now() * 1000 + 86400_000_000;
            const st = d ? "del" : w ? "wip" : e ? "exp" : "ok", sc = d ? "text-red" : w || e ? "text-yellow" : "text-green";
            return <tr key={i} className="hover:bg-accent/[.02] transition-colors">
              <td className="py-3 pl-5 pr-3 font-mono text-text3 text-xs text-right">{i + 1}</td>
              <td className="py-3 px-3 max-w-[300px] truncate" title={b.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="text-accent hover:underline">{shortName(b.name)}</Link></td>
              <td className="py-3 px-3 text-right font-mono font-medium text-accent">{fmtB(b.size)}</td>
              <td className="py-3 px-3"><span className={`font-mono text-xs font-medium ${sc}`}>{st}</span></td>
              <td className="py-3 px-3"><Link href={`/tools/sp-explorer/owner/${b.owner}`} className="text-accent hover:underline font-mono text-xs">{short(b.owner)}</Link></td>
              {showTime && <td className="py-3 pr-5 pl-3 text-right font-mono text-xs text-text3">{ago(parseInt(b.created, 10) / 1000)}</td>}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function EventsTable({ events }: { events: { name: string; owner: string; type: string; time: string; hash?: string }[] }) {
  if (!events?.length) return <div className="py-20 text-center text-text3 text-sm">No recent events.</div>;
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-text3 text-xs font-medium uppercase tracking-wider">
          <th className="py-3.5 pl-5 pr-3 w-32">Type</th><th className="py-3.5 px-3">Blob</th><th className="py-3.5 px-3">Owner</th><th className="py-3.5 pr-5 pl-3 text-right w-44">Time</th>
        </tr></thead>
        <tbody className="divide-y divide-border">
          {events.map((e, i) => <tr key={i} className="hover:bg-accent/[.02] transition-colors">
            <td className="py-3 pl-5 pr-3 font-mono text-xs text-text3">{e.type || "—"}</td>
            <td className="py-3 px-3 max-w-[350px] truncate" title={e.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} className="text-accent hover:underline">{shortName(e.name)}</Link></td>
            <td className="py-3 px-3"><Link href={`/tools/sp-explorer/owner/${e.owner}`} className="text-accent hover:underline font-mono text-xs">{short(e.owner)}</Link></td>
            <td className="py-3 pr-5 pl-3 text-right font-mono text-xs text-text3">{e.time ? new Date(e.time).toLocaleString() : "—"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function PriceSection({ totalSize, growth }: { totalSize: number; growth: { weekBlobs: number; weekSize: number; dayBlobs: number; daySize: number } }) {
  const gb = totalSize > 0 ? totalSize / (1024 ** 3) : 0;
  const s = gb * .01, a = gb * .073, pct = a > 0 ? Math.round((1 - s / a) * 100) : 70;
  return <div className="max-w-2xl">
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="rounded-2xl bg-surface border border-border shadow-sm p-6 text-center"><div className="text-sm text-text2 mb-2">AWS S3</div><div className="text-2xl font-extrabold font-mono text-red">${a.toFixed(0)}</div><div className="text-xs text-text3 mt-2">$0.023 + $0.05/GB</div></div>
      <div className="rounded-2xl bg-surface border border-border shadow-sm p-6 text-center"><div className="text-sm text-text2 mb-2">Shelby</div><div className="text-2xl font-extrabold font-mono text-green">${s.toFixed(0)}</div><div className="text-xs text-text3 mt-2">$0.01 + $0.014/GB</div></div>
      <div className="rounded-2xl bg-accent/5 border border-accent/20 p-6 text-center"><div className="text-sm text-text2 mb-2">Savings</div><div className="text-2xl font-extrabold font-mono text-accent">~{pct}%</div><div className="text-xs text-text3 mt-2">{fmtB(totalSize)} total</div></div>
    </div>
    <div className="rounded-2xl bg-surface border border-border shadow-sm p-4 text-sm text-text2 font-mono">
      7d +{fmtN(growth.weekBlobs)} ({fmtB(growth.weekSize)}) &middot; 24h +{fmtN(growth.dayBlobs)} ({fmtB(growth.daySize)})
    </div>
  </div>;
}

function DevSection() {
  return <div className="max-w-2xl space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {["docs.shelby.xyz","github.com/shelby","developers.shelby.xyz","discord.gg/shelbyserves"].map((n,i) => (
        <a key={i} href={`https://${n}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-surface border border-border shadow-sm p-5 text-sm font-medium text-text hover:text-accent hover:border-accent/30 transition-colors">{n}</a>
      ))}
    </div>
    <div className="rounded-2xl bg-surface border border-border shadow-sm p-6">
      <div className="text-sm text-text2 mb-3">REST API</div>
      <code className="block font-mono text-sm text-accent bg-accent/5 px-4 py-3 rounded-xl">GET /api/network-stats</code>
      <a href="/api/network-stats" target="_blank" className="inline-block mt-3 text-sm text-accent hover:underline">Open →</a>
    </div>
  </div>;
}
