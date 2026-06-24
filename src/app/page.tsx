import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Analytics" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,5)}...${a.slice(-3)}`}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function AnalyticsPage() {
  const d = await getShelbyData("health", "");

  const avgHealth = d.nodes.length > 0
    ? Math.round(d.nodes.reduce((sum, n) => {
        const pct = n.totalSlots > 0 ? (n.activeSlots / n.totalSlots) * 100 : 0;
        const h = n.lastSeen ? (Date.now() - n.lastSeen / 1000) / 3600000 : 999;
        return sum + Math.round(pct * .6 + Math.max(0, 100 - h * 10) * .4);
      }, 0) / d.nodes.length) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-2xl font-extrabold">ShelbyNet <span className="text-text3 font-normal text-base">Analytics</span></h1>
        <span className="text-xs text-text3 font-mono">{fmtN(d.blobCount)} blobs · {fmtB(d.totalSize)} · {d.activeSPs}/{d.totalSPs} SPs</span>
        <span className="ml-auto text-xs text-text3 font-mono">{new Date().toISOString()}</span>
      </div>

      {d.error && <div className="mb-4 p-3 border border-red/20 bg-red-50 dark:bg-red-500/10 text-xs text-red font-mono">{d.error}</div>}

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SP Health */}
        <Card title="SP Health" subtitle={`${d.nodes.length} providers · avg score ${avgHealth}/100`} badge={avgHealth >= 70 ? "Healthy" : avgHealth >= 50 ? "Warning" : "Critical"} badgeColor={avgHealth >= 70 ? "text-green bg-green/10" : avgHealth >= 50 ? "text-yellow bg-yellow/10" : "text-red bg-red/10"}>
          <div className="space-y-1">
            {d.nodes.slice(0, 8).map((sp, i) => {
              const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
              const hoursAgo = sp.lastSeen ? (Date.now() - sp.lastSeen / 1000) / 3600000 : 999;
              const health = Math.round(pct * .6 + Math.max(0, 100 - hoursAgo * 10) * .4);
              const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
              const recent = sp.lastSeen && (Date.now() - sp.lastSeen / 1000) < 600_000;
              return (
                <div key={sp.address} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                  <span className="font-mono text-text3 text-xs w-4">{i + 1}</span>
                  {recent && <span className="w-2 h-2 rounded-full bg-green shrink-0" />}
                  <Link href={`/tools/sp-explorer/${sp.address}`} className="text-link hover:underline font-mono text-xs flex-1">{short(sp.address)}</Link>
                  <span className={`font-mono text-xs font-semibold w-12 text-right ${hc}`}>{health}</span>
                  <span className="font-mono text-xs text-green w-10 text-right">{sp.activeSlots}</span>
                  <span className="text-text3 text-xs w-12 text-right">{ago(sp.lastSeen)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between">
            <a href="/?tab=sp" className="text-xs text-link hover:underline">View all →</a>
            <a href="/api/export-sp" className="text-xs text-text3 hover:text-text font-mono">CSV</a>
          </div>
        </Card>

        {/* Growth */}
        <Card title="Storage Growth" subtitle="Blob volume over time">
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-border mb-3">
            {d.blobCount > 0 && <>
              <div className="bg-link/30 h-full" style={{ width: `${Math.max(1, ((d.blobCount - d.growth.weekBlobs) / d.blobCount) * 100)}%` }} />
              <div className="bg-link/60 h-full" style={{ width: `${Math.max(1, ((d.growth.weekBlobs - d.growth.dayBlobs) / d.blobCount) * 100)}%` }} />
              <div className="bg-link h-full" style={{ width: `${Math.max(1, (d.growth.dayBlobs / d.blobCount) * 100)}%` }} />
            </>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="border border-border rounded p-3 bg-surface"><div className="text-text3 text-xs">24h new</div><div className="font-mono font-bold text-link">+{fmtN(d.growth.dayBlobs)}</div><div className="text-xs text-text3 font-mono">{fmtB(d.growth.daySize)}</div></div>
            <div className="border border-border rounded p-3 bg-surface"><div className="text-text3 text-xs">7d new</div><div className="font-mono font-bold">{fmtN(d.growth.weekBlobs)}</div><div className="text-xs text-text3 font-mono">{fmtB(d.growth.weekSize)}</div></div>
          </div>
        </Card>

        {/* Cost comparison */}
        <Card title="Cost Comparison" subtitle="Shelby vs AWS S3">
          <CostCompare totalSize={d.totalSize} />
        </Card>

        {/* File types */}
        <Card title="File Types" subtitle="Based on largest 50 blobs">
          <FileTypes blobs={d.topBlobs} />
        </Card>

        {/* Top SP detail */}
        {d.nodes.length > 0 && (
          <TopSPCard sp={d.nodes[0]} />
        )}

        {/* Developers */}
        <Card title="Developers" subtitle="API & SDK">
          <div className="space-y-2">
            <div className="border border-border rounded p-3 bg-surface font-mono text-sm">
              <span className="text-text3">GET</span> <a href="/api/network-stats" target="_blank" className="text-link hover:underline">/api/network-stats</a>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {["@shelby-protocol/sdk","@shelby-protocol/cli","shelby-mcp","x402s"].map(p => <div key={p} className="border border-border rounded p-2 bg-surface font-mono text-xs text-text2">$ npm i {p}</div>)}
            </div>
            <div className="flex gap-3 text-xs">
              {[{n:"docs",h:"https://docs.shelby.xyz"},{n:"github",h:"https://github.com/shelby/examples"},{n:"discord",h:"https://discord.gg/shelbyserves"}].map(l => <a key={l.h} href={l.h} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">{l.n}</a>)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Card ──
function Card({ title, subtitle, badge, badgeColor, children }: { title: string; subtitle?: string; badge?: string; badgeColor?: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded bg-surface">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-text3 mt-0.5">{subtitle}</p>}
        </div>
        {badge && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ── Top SP Card ──
function TopSPCard({ sp }: { sp: { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number } }) {
  const pct = sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 100) : 0;
  const health = sp.lastSeen ? Math.round(pct * .6 + Math.max(0, 100 - ((Date.now() - sp.lastSeen / 1000) / 3600000) * 10) * .4) : 0;
  const hc = health >= 80 ? "text-green" : health >= 50 ? "text-yellow" : "text-red";
  return (
    <Card title="Top Provider" subtitle="Highest health score">
      <Link href={`/tools/sp-explorer/${sp.address}`} className="block">
        <div className="font-mono text-sm text-link hover:underline mb-3">{short(sp.address)}</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="border border-border rounded p-3 bg-surface"><div className={`text-xl font-bold font-mono ${hc}`}>{health}</div><div className="text-xs text-text3 mt-0.5">Health</div></div>
          <div className="border border-border rounded p-3 bg-surface"><div className="text-xl font-bold font-mono text-green">{sp.activeSlots}</div><div className="text-xs text-text3 mt-0.5">Active</div></div>
          <div className="border border-border rounded p-3 bg-surface"><div className="text-xl font-bold font-mono">{sp.totalSlots}</div><div className="text-xs text-text3 mt-0.5">Total</div></div>
        </div>
      </Link>
    </Card>
  );
}

function FileTypes({ blobs }: { blobs: { name: string; size: number }[] }) {
  const types: Record<string, { count: number; size: number }> = {};
  for (const b of blobs) { const ext = b.name.split(".").pop()?.toLowerCase() || ""; const cat = /^(mp4|mkv|avi|mov|webm)$/.test(ext) ? "Video" : /^(jpg|jpeg|png|gif|webp|svg)$/.test(ext) ? "Image" : /^(pdf|doc|docx|txt|md|csv|json|xml)$/.test(ext) ? "Document" : /^(rar|zip|gz|tar|7z)$/.test(ext) ? "Archive" : "Other"; if (!types[cat]) types[cat] = { count: 0, size: 0 }; types[cat].count++; types[cat].size += b.size; }
  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(types).sort((a, b) => b[1].size - a[1].size).map(([cat, s]) => (
        <div key={cat} className="border border-border rounded p-2 bg-surface text-center">
          <div className="font-semibold text-xs">{cat}</div>
          <div className="font-mono text-[10px] text-link mt-0.5">{fmtB(s.size)}</div>
          <div className="text-[9px] text-text3">{s.count}</div>
        </div>
      ))}
    </div>
  );
}

function CostCompare({ totalSize }: { totalSize: number }) {
  const gb = totalSize > 0 ? totalSize / (1024 ** 3) : 0;
  const shelby = gb * .01, aws = gb * .073, pct = aws > 0 ? Math.round((1 - shelby / aws) * 100) : 70;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="border border-border rounded p-3 bg-surface text-center"><div className="text-xs text-text2">AWS S3</div><div className="text-lg font-bold font-mono text-red">${aws.toFixed(0)}</div></div>
      <div className="border border-border rounded p-3 bg-surface text-center"><div className="text-xs text-text2">Shelby</div><div className="text-lg font-bold font-mono text-green">${shelby.toFixed(0)}</div></div>
      <div className="border border-link/20 bg-link/5 rounded p-3 text-center"><div className="text-xs text-text2">Savings</div><div className="text-lg font-bold font-mono text-link">~{pct}%</div></div>
    </div>
  );
}
