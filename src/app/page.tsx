import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Analytics" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,5)}...${a.slice(-3)}`}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

const TABS = [
  { k: "sp", l: "SP Operators" },
  { k: "network", l: "Network Analytics" },
  { k: "dev", l: "Developers" },
] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ sort?: string; search?: string; tab?: string }> }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "health", search = sp.search ?? "", tab = sp.tab ?? "sp";
  const d = await getShelbyData(sort, search);

  const avgHealth = d.nodes.length > 0
    ? Math.round(d.nodes.reduce((sum, n) => {
        const pct = n.totalSlots > 0 ? (n.activeSlots / n.totalSlots) * 100 : 0;
        const h = n.lastSeen ? (Date.now() - n.lastSeen / 1000) / 3600000 : 999;
        return sum + Math.round(pct * .6 + Math.max(0, 100 - h * 10) * .4);
      }, 0) / d.nodes.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-baseline gap-6 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">ShelbyNet</h1>
        <span className="text-xs text-text3 font-mono uppercase tracking-wider">Analytics</span>
        <span className="ml-auto text-xs text-text3 font-mono">{new Date().toISOString()}</span>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-text3 font-mono mb-6">
        <span><b className="text-text font-semibold">{fmtN(d.blobCount)}</b> blobs</span>
        <span className="text-border">·</span>
        <span><b className="text-text font-semibold">{fmtB(d.totalSize)}</b> stored</span>
        <span className="text-border">·</span>
        <span><b className="text-text font-semibold">{d.activeSPs}/{d.totalSPs}</b> SPs</span>
        <span className="text-border">·</span>
        <span>24h <b className="text-link">+{fmtN(d.growth.dayBlobs)}</b></span>
        <span className="text-border">·</span>
        <span>7d <b className="text-link">+{fmtN(d.growth.weekBlobs)}</b></span>
        {d.error && <span className="text-red">{d.error}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-border">
        {TABS.map(t => (
          <a key={t.k} href={`?tab=${t.k}&sort=${sort}`}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${tab === t.k ? "border-link text-link" : "border-transparent text-text2 hover:text-text"}`}>
            {t.l}
          </a>
        ))}
      </div>

      {/* Tab: SP Operators */}
      {tab === "sp" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text2">
              {d.nodes.length} providers · avg health <span className={avgHealth >= 70 ? "text-green font-semibold" : avgHealth >= 50 ? "text-yellow font-semibold" : "text-red font-semibold"}>{avgHealth}/100</span>
            </p>
            <div className="flex items-center gap-2">
              <form className="flex gap-2">
                <input name="search" defaultValue={search} placeholder="0x…" className="px-2.5 py-1.5 text-xs border border-border bg-surface text-text placeholder:text-text3 focus:outline-none focus:border-link font-mono w-48" />
                <input type="hidden" name="tab" value="sp" />
                <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-link text-white rounded hover:opacity-90">Filter</button>
                {search && <a href="?tab=sp&sort=health" className="px-3 py-1.5 text-xs border border-border text-text2 rounded hover:text-text">Clear</a>}
              </form>
              <span className="text-xs text-text3">Sort:</span>
              <SortBtn href="?tab=sp&sort=health" active={sort === "health"}>Health</SortBtn>
              <SortBtn href="?tab=sp&sort=active" active={sort === "active"}>Active</SortBtn>
              <SortBtn href="?tab=sp&sort=total" active={sort === "total"}>Total</SortBtn>
              <a href="/api/export-sp" className="text-xs px-2.5 py-1.5 border border-border text-text2 hover:text-text font-mono rounded transition-colors">CSV</a>
            </div>
          </div>

          <SPTable nodes={d.nodes} />
        </div>
      )}

      {/* Tab: Network Analytics */}
      {tab === "network" && (
        <div className="space-y-8">
          {/* Growth bar */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Storage Growth</h2>
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-border max-w-lg mb-2">
              {d.blobCount > 0 && <>
                <div className="bg-link/30 h-full" style={{ width: `${Math.max(1, ((d.blobCount - d.growth.weekBlobs) / d.blobCount) * 100)}%` }} />
                <div className="bg-link/60 h-full" style={{ width: `${Math.max(1, ((d.growth.weekBlobs - d.growth.dayBlobs) / d.blobCount) * 100)}%` }} />
                <div className="bg-link h-full" style={{ width: `${Math.max(1, (d.growth.dayBlobs / d.blobCount) * 100)}%` }} />
              </>}
            </div>
            <div className="flex gap-4 text-xs text-text3 font-mono">
              <span><span className="inline-block w-2 h-2 bg-link/30 rounded-sm mr-1" />Early ({fmtN(d.blobCount - d.growth.weekBlobs)})</span>
              <span><span className="inline-block w-2 h-2 bg-link/60 rounded-sm mr-1" />7d ({fmtN(d.growth.weekBlobs - d.growth.dayBlobs)})</span>
              <span><span className="inline-block w-2 h-2 bg-link rounded-sm mr-1" />24h ({fmtN(d.growth.dayBlobs)})</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="border border-border rounded p-4 bg-surface"><div className="text-text3 text-xs">24h new blobs</div><div className="font-mono font-bold text-lg text-link">+{fmtN(d.growth.dayBlobs)}</div></div>
              <div className="border border-border rounded p-4 bg-surface"><div className="text-text3 text-xs">24h new data</div><div className="font-mono font-bold text-lg text-link">+{fmtB(d.growth.daySize)}</div></div>
              <div className="border border-border rounded p-4 bg-surface"><div className="text-text3 text-xs">7d new blobs</div><div className="font-mono font-bold text-lg">{fmtN(d.growth.weekBlobs)}</div></div>
              <div className="border border-border rounded p-4 bg-surface"><div className="text-text3 text-xs">7d new data</div><div className="font-mono font-bold text-lg">{fmtB(d.growth.weekSize)}</div></div>
            </div>
          </div>

          {/* File types */}
          <div>
            <h2 className="text-sm font-semibold mb-3">File Type Distribution</h2>
            <FileTypes blobs={d.topBlobs} />
          </div>

          {/* Cost comparison */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Cost Comparison</h2>
            <CostCompare totalSize={d.totalSize} />
          </div>
        </div>
      )}

      {/* Tab: Developers */}
      {tab === "dev" && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-sm font-semibold mb-3">REST API</h2>
            <p className="text-sm text-text2 mb-3">Programmatic access to all analytics data.</p>
            <div className="border border-border rounded p-4 bg-surface font-mono text-sm">
              <span className="text-text3">GET</span> <a href="/api/network-stats" target="_blank" className="text-link hover:underline">/api/network-stats</a>
              <p className="text-xs text-text3 mt-2">Returns JSON: SP list with health scores, blob stats, growth data, network status.</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-3">SDK</h2>
            <div className="space-y-1 font-mono text-sm">
              {["@shelby-protocol/sdk","@shelby-protocol/cli","shelby-mcp","x402s"].map(p => <div key={p} className="border border-border rounded p-2.5 bg-surface"><span className="text-text3">$</span> <span className="text-text2">npm install {p}</span></div>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[{n:"docs.shelby.xyz",h:"https://docs.shelby.xyz"},{n:"github.com/shelby",h:"https://github.com/shelby/examples"},{n:"developers.shelby.xyz",h:"https://developers.shelby.xyz"},{n:"discord.gg/shelbyserves",h:"https://discord.gg/shelbyserves"}].map(l => <a key={l.h} href={l.h} target="_blank" rel="noopener noreferrer" className="border border-border rounded p-4 bg-surface hover:border-link/30 transition-colors"><span className="font-medium text-text">{l.n}</span></a>)}
          </div>
          <div className="border border-border rounded p-4 bg-surface text-xs text-text3">
            <b className="text-text2">ShelbyNet</b> · public testnet · DoubleZero fiber · Aptos settlement · no persistence guarantees.
          </div>
        </div>
      )}
    </div>
  );
}

function SortBtn({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <a href={href} className={`text-xs px-2.5 py-1.5 rounded border font-mono transition-colors ${active ? "border-link text-link bg-link/5" : "border-border text-text2 hover:text-text"}`}>{children}</a>;
}

function SPTable({ nodes }: { nodes: { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number }[] }) {
  if (!nodes.length) return <div className="py-16 text-center text-text3 text-sm">No storage providers found.</div>;
  return (
    <div>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface border-b border-border text-left text-text2 text-xs font-medium">
            <th className="py-2.5 pl-4 pr-3 w-10">#</th>
            <th className="py-2.5 px-3">Address</th>
            <th className="py-2.5 px-3 text-right w-20">Health</th>
            <th className="py-2.5 px-3 text-right w-20">Active</th>
            <th className="py-2.5 px-3 text-right w-16">Join</th>
            <th className="py-2.5 px-3 text-right w-20">Vacated</th>
            <th className="py-2.5 px-3">Active Rate</th>
            <th className="py-2.5 pr-4 pl-3 text-right w-20">Seen</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {nodes.map((sp, i) => {
              const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
              const h = sp.lastSeen ? (Date.now() - sp.lastSeen / 1000) / 3600000 : 999;
              const health = Math.round(pct * .6 + Math.max(0, 100 - h * 10) * .4);
              const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
              const recent = sp.lastSeen && (Date.now() - sp.lastSeen / 1000) < 600_000;
              return (
                <tr key={sp.address} className="hover:bg-surface transition-colors">
                  <td className="py-2.5 pl-4 pr-3 font-mono text-text3 text-xs">{i + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {recent && <span className="w-2 h-2 rounded-full bg-green shrink-0" title="Active <10 min" />}
                      <Link href={`/tools/sp-explorer/${sp.address}`} className="text-link hover:underline font-mono text-xs">{short(sp.address)}</Link>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right"><span className={`font-mono text-xs font-semibold ${hc}`}>{health}</span></td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-green">{sp.activeSlots}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-yellow">{sp.joiningSlots || "—"}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red">{sp.vacatedSlots || "—"}</td>
                  <td className="py-2.5 px-3"><div className="flex items-center gap-2 max-w-[120px]"><div className="flex-1 h-1.5 bg-border rounded-full"><div className="h-full bg-link rounded-full" style={{ width: `${pct}%` }} /></div><span className="font-mono text-xs text-text3 w-8 text-right">{pct}%</span></div></td>
                  <td className="py-2.5 pr-4 pl-3 text-right font-mono text-xs text-text3">{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text3 font-mono">{nodes.length} providers</p>
    </div>
  );
}

function FileTypes({ blobs }: { blobs: { name: string; size: number }[] }) {
  const types: Record<string, { count: number; size: number }> = {};
  for (const b of blobs) {
    const ext = b.name.split(".").pop()?.toLowerCase() || "";
    const cat = /^(mp4|mkv|avi|mov|webm)$/.test(ext) ? "Video" : /^(jpg|jpeg|png|gif|webp|svg)$/.test(ext) ? "Image" : /^(pdf|doc|docx|txt|md|csv|json|xml)$/.test(ext) ? "Document" : /^(rar|zip|gz|tar|7z)$/.test(ext) ? "Archive" : "Other";
    if (!types[cat]) types[cat] = { count: 0, size: 0 };
    types[cat].count++; types[cat].size += b.size;
  }
  return (
    <div className="grid grid-cols-5 gap-4">
      {Object.entries(types).sort((a, b) => b[1].size - a[1].size).map(([cat, s]) => (
        <div key={cat} className="border border-border rounded p-4 bg-surface text-center">
          <div className="font-semibold text-sm mb-1">{cat}</div>
          <div className="font-mono text-xs text-link font-medium">{fmtB(s.size)}</div>
          <div className="text-xs text-text3 mt-0.5">{s.count} files</div>
        </div>
      ))}
    </div>
  );
}

function CostCompare({ totalSize }: { totalSize: number }) {
  const gb = totalSize > 0 ? totalSize / (1024 ** 3) : 0;
  const shelby = gb * .01, aws = gb * .073, pct = aws > 0 ? Math.round((1 - shelby / aws) * 100) : 70;
  return (
    <div className="grid grid-cols-3 gap-4 max-w-xl">
      <div className="border border-border rounded p-5 bg-surface text-center"><div className="text-xs text-text2 mb-1">AWS S3</div><div className="text-xl font-bold font-mono text-red">${aws.toFixed(0)}</div><div className="text-xs text-text3 mt-1">$0.023 + $0.05/GB</div></div>
      <div className="border border-border rounded p-5 bg-surface text-center"><div className="text-xs text-text2 mb-1">Shelby</div><div className="text-xl font-bold font-mono text-green">${shelby.toFixed(0)}</div><div className="text-xs text-text3 mt-1">$0.01 + $0.014/GB</div></div>
      <div className="border border-link/20 bg-link/5 rounded p-5 text-center"><div className="text-xs text-text2 mb-1">Savings</div><div className="text-xl font-bold font-mono text-link">~{pct}%</div><div className="text-xs text-text3 mt-1">{fmtB(totalSize)} total</div></div>
    </div>
  );
}
