import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,5)}...${a.slice(-3)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,40)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ sort?: string; search?: string; tab?: string }> }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "active", search = sp.search ?? "", tab = sp.tab ?? "sp";
  const d = await getShelbyData(sort, search);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Summary */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-text3 font-mono mb-5">
        <span><span className="font-semibold text-text">{fmtN(d.blobCount)}</span> blobs</span>
        <span className="text-border">&middot;</span>
        <span><span className="font-semibold text-text">{fmtB(d.totalSize)}</span> stored</span>
        <span className="text-border">&middot;</span>
        <span><span className="font-semibold text-text">{fmtN(d.activityCount)}</span> ops</span>
        <span className="text-border">&middot;</span>
        <span><span className="font-semibold text-text">{d.activeSPs}/{d.totalSPs}</span> SPs</span>
        <span className="text-border">&middot;</span>
        <span>24h <span className="text-link font-semibold">+{fmtN(d.growth.dayBlobs)}</span> blobs</span>
        <span className="text-border">&middot;</span>
        <span>7d <span className="text-link">+{fmtN(d.growth.weekBlobs)}</span></span>
      </div>

      {/* Growth bars */}
      <div className="flex gap-1 mb-6 h-1 rounded-full overflow-hidden bg-border max-w-md">
        {d.blobCount > 0 && (
          <>
            <div className="bg-link/30 h-full" style={{ width: `${Math.max(1, ((d.blobCount - d.growth.weekBlobs) / d.blobCount) * 100)}%` }} title={`Early: ${fmtN(d.blobCount - d.growth.weekBlobs)}`} />
            <div className="bg-link/60 h-full" style={{ width: `${Math.max(1, ((d.growth.weekBlobs - d.growth.dayBlobs) / d.blobCount) * 100)}%` }} title={`7d: ${fmtN(d.growth.weekBlobs - d.growth.dayBlobs)}`} />
            <div className="bg-link h-full" style={{ width: `${Math.max(1, (d.growth.dayBlobs / d.blobCount) * 100)}%` }} title={`24h: ${fmtN(d.growth.dayBlobs)}`} />
          </>
        )}
      </div>

      {d.error && (
        <div className="mb-6 p-3 border border-red/20 bg-red-50 dark:bg-red-500/10 text-xs text-red font-mono">{d.error}</div>
      )}

      {/* Toolbar: search + export */}
      <div className="flex items-center gap-3 mb-6">
        <form className="flex-1 flex gap-2">
          <input name="search" defaultValue={search}
            placeholder={tab === "blobs" ? "Filter by blob name..." : "Filter by SP address..."}
            className="flex-1 max-w-md px-3 py-2 text-sm border border-border bg-surface text-text placeholder:text-text3 focus:outline-none focus:border-link rounded font-mono" />
          <input type="hidden" name="tab" value={tab} />
          <button type="submit" className="px-4 py-2 text-sm font-medium bg-[var(--color-link)] text-white rounded hover:opacity-90 transition-opacity">Filter</button>
          {search && <a href={`?tab=${tab}&sort=${sort}`} className="px-3 py-2 text-sm border border-border text-text2 rounded hover:text-text transition-colors">Clear</a>}
        </form>
        {tab === "sp" && <>
          <span className="text-xs text-text3">Sort:</span>
          <a href="?tab=sp&sort=active" className={`text-xs px-2.5 py-1.5 rounded border font-mono transition-colors ${sort === "active" && !search ? "border-link text-link bg-link/[.06]" : "border-border text-text2 hover:text-text"}`}>Active</a>
          <a href="?tab=sp&sort=total" className={`text-xs px-2.5 py-1.5 rounded border font-mono transition-colors ${sort === "total" && !search ? "border-link text-link bg-link/[.06]" : "border-border text-text2 hover:text-text"}`}>Total</a>
        </>}
        <a href="/api/export-sp" className="text-xs px-2.5 py-1.5 rounded border border-border text-text2 hover:text-text font-mono transition-colors">CSV</a>
      </div>

      {/* Content */}
      {tab === "sp" && <SPTable nodes={d.nodes} />}
      {tab === "blobs" && <BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs} />}
      {tab === "events" && <EventsTable events={d.events} />}
      {tab === "price" && <PriceSection totalSize={d.totalSize} growth={d.growth} />}
      {tab === "dev" && <DevSection />}
    </div>
  );
}

function SPTable({ nodes }: { nodes: { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number }[] }) {
  if (!nodes.length) return <div className="py-20 text-center text-text3 text-sm">No storage providers found.</div>;
  return (
    <div>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border text-left text-text2 text-xs font-medium">
              <th className="py-2.5 pl-4 pr-3">Address</th>
              <th className="py-2.5 px-3 text-right w-20">Active</th>
              <th className="py-2.5 px-3 text-right w-16">Join</th>
              <th className="py-2.5 px-3 text-right w-20">Vacated</th>
              <th className="py-2.5 px-3 text-right w-20">Health</th>
              <th className="py-2.5 pr-4 pl-3 text-right w-20">Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {nodes.map(sp => {
              const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
              const h = sp.lastSeen ? (Date.now() - sp.lastSeen / 1000) / 3600000 : 999;
              const health = Math.round(pct * .6 + Math.max(0, 100 - h * 10) * .4);
              const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
              return (
                <tr key={sp.address} className="hover:bg-surface transition-colors">
                  <td className="py-2.5 pl-4 pr-3">
                  <div className="flex items-center gap-2">
                    {sp.lastSeen && (Date.now() - sp.lastSeen / 1000) < 600_000 && <span className="w-2 h-2 rounded-full bg-green shrink-0" title="Active within 10 min" />}
                    <Link href={`/tools/sp-explorer/${sp.address}`} className="text-link hover:underline font-mono text-xs">{short(sp.address)}</Link>
                  </div>
                </td>
                  <td className="py-2 px-3 text-right font-mono font-medium text-green">{sp.activeSlots}</td>
                  <td className="py-2 px-3 text-right font-mono text-yellow">{sp.joiningSlots || "—"}</td>
                  <td className="py-2 px-3 text-right font-mono text-red">{sp.vacatedSlots || "—"}</td>
                  <td className="py-2 px-3 text-right"><span className={`font-mono text-xs font-semibold ${hc}`}>{health}</span></td>
                  <td className="py-2 pr-4 pl-3 text-right font-mono text-xs text-text3">{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text3 font-mono">{nodes.length} storage providers</p>
    </div>
  );
}

function BlobSection({ topBlobs, recentBlobs }: {
  topBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  recentBlobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
}) {
  return <div className="space-y-10">
    <div><h2 className="text-base font-semibold mb-4">Recent Uploads <span className="text-text3 font-normal">({recentBlobs.length})</span></h2><BlobTable blobs={recentBlobs} showTime /></div>
    <div><h2 className="text-base font-semibold mb-4">Largest Blobs <span className="text-text3 font-normal">({topBlobs.length})</span></h2><BlobTable blobs={topBlobs} /></div>
  </div>;
}

function BlobTable({ blobs, showTime }: {
  blobs: { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean }[];
  showTime?: boolean;
}) {
  if (!blobs?.length) return <div className="py-16 text-center text-text3 text-sm">No blobs found.</div>;
  return (
    <div className="border border-border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-surface border-b border-border text-left text-text2 text-xs font-medium">
          <th className="py-2.5 pl-4 pr-3 w-8">#</th><th className="py-2.5 px-3">Name</th><th className="py-2.5 px-3 text-right w-24">Size</th><th className="py-2.5 px-3 w-14">Status</th>
          <th className="py-2.5 px-3">Owner</th>{showTime && <th className="py-2.5 pr-4 pl-3 text-right w-16">Age</th>}
        </tr></thead>
        <tbody className="divide-y divide-border">
          {blobs.map((b, i) => {
            const del = b.isDeleted, wip = b.isWritten === false, exp = b.expires && parseInt(b.expires, 10) < Date.now() * 1000 + 86400_000_000;
            const st = del ? "del" : wip ? "wip" : exp ? "exp" : "ok";
            const sc = del ? "text-red" : wip || exp ? "text-yellow" : "text-green";
            return <tr key={i} className="hover:bg-surface transition-colors">
              <td className="py-2 pl-4 pr-3 font-mono text-text3 text-xs text-right">{i + 1}</td>
              <td className="py-2 px-3 max-w-[300px] truncate" title={b.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="text-link hover:underline">{shortName(b.name)}</Link></td>
              <td className="py-2 px-3 text-right font-mono font-medium text-link">{fmtB(b.size)}</td>
              <td className="py-2 px-3"><span className={`font-mono text-xs font-medium ${sc}`}>{st}</span></td>
              <td className="py-2 px-3"><Link href={`/tools/sp-explorer/owner/${b.owner}`} className="text-link hover:underline font-mono text-xs">{short(b.owner)}</Link></td>
              {showTime && <td className="py-2 pr-4 pl-3 text-right font-mono text-xs text-text3">{ago(parseInt(b.created, 10) / 1000)}</td>}
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
    <div className="border border-border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-surface border-b border-border text-left text-text2 text-xs font-medium">
          <th className="py-2.5 pl-4 pr-3 w-28">Type</th><th className="py-2.5 px-3">Blob</th><th className="py-2.5 px-3">Owner</th><th className="py-2.5 pr-4 pl-3 text-right w-44">Time</th>
        </tr></thead>
        <tbody className="divide-y divide-border">
          {events.map((e, i) => <tr key={i} className="hover:bg-surface transition-colors">
            <td className="py-2 pl-4 pr-3 font-mono text-xs text-text3">{e.type || "—"}</td>
            <td className="py-2 px-3 max-w-[350px] truncate" title={e.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} className="text-link hover:underline">{shortName(e.name)}</Link></td>
            <td className="py-2 px-3"><Link href={`/tools/sp-explorer/owner/${e.owner}`} className="text-link hover:underline font-mono text-xs">{short(e.owner)}</Link></td>
            <td className="py-2 pr-4 pl-3 text-right font-mono text-xs text-text3">{e.time ? new Date(e.time).toLocaleString() : "—"}</td>
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
      <div className="border border-border rounded p-6 text-center bg-surface"><div className="text-xs text-text2 mb-1">AWS S3</div><div className="text-2xl font-bold font-mono text-red">${a.toFixed(0)}</div><div className="text-xs text-text3 mt-2">$0.023 + $0.05/GB</div></div>
      <div className="border border-border rounded p-6 text-center bg-surface"><div className="text-xs text-text2 mb-1">Shelby</div><div className="text-2xl font-bold font-mono text-green">${s.toFixed(0)}</div><div className="text-xs text-text3 mt-2">$0.01 + $0.014/GB</div></div>
      <div className="border border-link/20 bg-link/[.04] rounded p-6 text-center"><div className="text-xs text-text2 mb-1">Savings</div><div className="text-2xl font-bold font-mono text-link">~{pct}%</div><div className="text-xs text-text3 mt-2">{fmtB(totalSize)} total</div></div>
    </div>
    <div className="border border-border rounded p-4 bg-surface text-sm text-text2 font-mono">
      7d +{fmtN(growth.weekBlobs)} ({fmtB(growth.weekSize)}) &middot; 24h +{fmtN(growth.dayBlobs)} ({fmtB(growth.daySize)})
    </div>
  </div>;
}

function DevSection() {
  return <div className="max-w-2xl space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {["docs.shelby.xyz","github.com/shelby","developers.shelby.xyz","discord.gg/shelbyserves"].map((n,i) => <a key={i} href={`https://${n}`} target="_blank" rel="noopener noreferrer" className="border border-border rounded p-5 bg-surface text-sm font-medium text-text hover:text-link hover:border-link/30 transition-colors">{n}</a>)}
    </div>
    <div className="border border-border rounded p-6 bg-surface">
      <div className="text-sm text-text2 mb-3">REST API</div>
      <code className="block font-mono text-sm text-link bg-link/[.04] px-4 py-3 rounded">GET /api/network-stats</code>
      <a href="/api/network-stats" target="_blank" className="inline-block mt-3 text-sm text-link hover:underline">Open →</a>
    </div>
    <div className="border border-border rounded p-5 bg-surface text-xs text-text3">
      ShelbyNet public testnet &middot; DoubleZero fiber &middot; Aptos settlement &middot; No persistence guarantees.
    </div>
  </div>;
}
