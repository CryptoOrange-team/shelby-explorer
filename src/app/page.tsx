import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer", description: "SP nodes · Blob leaderboard · Live events · Cost comparison" };

function fmtB(b: number): string {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++}
  return `${v.toFixed(i>0?1:0)} ${u[i]}`;
}
function fmtN(n: number): string {
  if (n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n>=1_000) return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function short(a:string):string{return`${a.slice(0,6)}...${a.slice(-4)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,30)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function SPExplorerPage({ searchParams }: { searchParams: Promise<{ sort?:string;search?:string;tab?:string}> }) {
  const sp = await searchParams;
  const sort=sp.sort??"active",search=sp.search??"",tab=sp.tab??"sp";
  const d = await getShelbyData(sort,search);

  const insight = d.error ? "Data unavailable" :
    `Currently ${d.activeSPs} active SPs maintain ${d.activeSlots} slots. The network has accumulated ${fmtN(d.blobCount)} blobs (${fmtB(d.totalSize)}) with ${fmtN(d.activityCount)} total activities. Storage costs ~70% less than AWS S3.`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-5 py-8 sm:py-12">
      <AutoRefresh interval={30} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="font-mono text-[10px] sm:text-[11px] font-medium text-text3 uppercase tracking-wider mb-1">/ ShelbyNet Explorer</div>
          <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight">Network Overview</h1>
        </div>
        <AutoRefresh interval={30} />
      </div>

      {/* Dashboard Legend */}
      <div className="mb-4 p-3 rounded-xl border border-border bg-surface/30 text-xs text-text3 leading-relaxed">
        <span className="font-semibold text-text">ShelbyNet Explorer</span> &mdash; Real-time monitoring of storage providers, blobs, on-chain events, and network costs.
        Click column headers to sort, use search to filter. Auto-refreshes every <span className="font-mono text-accent">30s</span>.
        <span className="text-text3 ml-2">Source: GraphQL Indexer &middot; {new Date().toLocaleString()}</span>
      </div>

      {/* AI Insight */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-surface/50 backdrop-blur">
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0 mt-0.5">📊</span>
          <p className="text-xs sm:text-sm text-text2 leading-relaxed">{insight}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border text-xs text-text3">
          <span>7d added <strong className="text-text">{fmtN(d.growth.weekBlobs)}</strong> blobs ({fmtB(d.growth.weekSize)})</span>
          <span>24h added <strong className="text-text">{fmtN(d.growth.dayBlobs)}</strong> blobs ({fmtB(d.growth.daySize)})</span>
          <span>24h ratio <strong className="text-accent">{d.blobCount>0?((d.growth.dayBlobs/d.blobCount)*100).toFixed(1):"0"}%</strong></span>
        </div>
      </div>

      {d.error && <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-lg text-sm text-red-400 mb-6">{d.error}</div>}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
        <StatBox label="Blobs" value={fmtN(d.blobCount)} change={d.growth.dayBlobs>0?{val:fmtN(d.growth.dayBlobs),up:true}:undefined} />
        <StatBox label="Storage" value={fmtB(d.totalSize)} accent change={d.growth.daySize>0?{val:fmtB(d.growth.daySize),up:true}:undefined} />
        <StatBox label="Activities" value={fmtN(d.activityCount)} />
        <StatBox label="SP Nodes" value={`${d.activeSPs}/${d.totalSPs}`} sub="active/total" />
        <StatBox label="Slots" value={`${d.activeSlots}/${d.totalSlots}`} sub="active/total" />
        <StatBox label="Indexer" value={d.status?"Online":"—"} sub={d.status?`v${d.status.lastVersion.toLocaleString()}`:""} accent />
      </div>

      {/* Growth Visual */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-surface/50 backdrop-blur">
        <div className="text-xs font-semibold text-text3 uppercase tracking-wider mb-3">Storage Growth Distribution</div>
        <div className="space-y-2">
          {(()=>{
            const oldPct=d.blobCount>0?((d.blobCount-d.growth.weekBlobs)/d.blobCount)*100:0;
            const weekPct=d.blobCount>0?((d.growth.weekBlobs-d.growth.dayBlobs)/d.blobCount)*100:0;
            const dayPct=d.blobCount>0?(d.growth.dayBlobs/d.blobCount)*100:0;
            const items=[{label:"Early (>7d)",pct:oldPct,count:d.blobCount-d.growth.weekBlobs,color:"bg-border"},{label:"Last 7 days",pct:weekPct,count:d.growth.weekBlobs-d.growth.dayBlobs,color:"bg-blue-400/60"},{label:"Last 24h",pct:dayPct,count:d.growth.dayBlobs,color:"bg-accent"}];
            return items.map(item=>(
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-[10px] text-text3 w-24 shrink-0">{item.label}</span>
                <div className="flex-1 h-4 bg-border rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full transition-all`} style={{width:`${Math.max(1,item.pct)}%`}}/></div>
                <span className="font-mono text-[10px] text-text2 w-16 text-right">{fmtN(item.count)}</span>
                <span className="font-mono text-[10px] text-text3 w-10 text-right">{item.pct.toFixed(1)}%</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Live Ticker */}
      {d.events.length>0&&(
        <div className="mb-6 p-3 rounded-xl border border-accent/20 bg-accent/5 overflow-hidden">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0"/>
            <span className="font-mono text-[10px] text-accent font-semibold shrink-0">LIVE</span>
            <div className="overflow-x-hidden relative flex-1">
              <div className="flex gap-6 whitespace-nowrap" style={{animation:"scroll-x 30s linear infinite"}}>
                {d.events.slice(0,8).map((e,i)=>(
                  <span key={i} className="text-text3 text-[11px]">{e.type} <span className="text-text2">{shortName(e.name)}</span><span className="text-text3 ml-2">{new Date(e.time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>{i<7&&<span className="text-border mx-3">|</span>}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-border overflow-x-auto">
        {[{key:"sp",label:"SP Nodes"},{key:"blobs",label:"Blob Rankings"},{key:"events",label:"Live Events"},{key:"price",label:"Cost Comparison"},{key:"dev",label:"Developers"}].map(t=>(
          <a key={t.key} href={`?tab=${t.key}&sort=${sort}`} className={`shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${tab===t.key?"border-accent text-text":"border-transparent text-text3 hover:text-text2"}`}>{t.label}</a>
        ))}
        <a href="/tools/sp-explorer/map" className="shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-text3 hover:text-text2 transition-colors">Map</a>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <form className="flex-1 flex gap-2">
          <input name="search" defaultValue={search} placeholder={tab==="blobs"?"Search blob name...":"Search SP address..."}
            className="flex-1 px-3 py-2 text-xs border border-border rounded-lg bg-surface text-text placeholder:text-text3 focus:outline-none focus:border-accent font-mono min-w-0"/>
          <input type="hidden" name="tab" value={tab}/>
          <button type="submit" className="shrink-0 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:brightness-110 transition-colors">Search</button>
          {search&&<a href={`?tab=${tab}&sort=${sort}`} className="shrink-0 px-3 py-2 text-xs border border-border rounded-lg text-text3 hover:text-text transition-colors">Clear</a>}
        </form>
        <div className="flex gap-1 shrink-0">
          <a href="?tab=sp&sort=active" className={`font-mono text-[10px] px-2 py-1 rounded border transition-colors ${sort==="active"&&!search?"border-accent text-accent bg-accent/5":"border-border text-text3 hover:text-text"}`}>Active</a>
          <a href="?tab=sp&sort=total" className={`font-mono text-[10px] px-2 py-1 rounded border transition-colors ${sort==="total"&&!search?"border-accent text-accent bg-accent/5":"border-border text-text3 hover:text-text"}`}>Total</a>
          <a href="/api/export-sp" className="font-mono text-[10px] px-2 py-1 rounded border border-accent/30 text-accent hover:bg-accent/10 transition-colors">CSV</a>
        </div>
      </div>

      {/* Tab Content */}
      {tab==="sp"&&<SPTable nodes={d.nodes} search={search}/>}
      {tab==="blobs"&&<BlobTab topBlobs={d.topBlobs} recentBlobs={d.recentBlobs}/>}
      {tab==="events"&&<EventsTable events={d.events}/>}
      {tab==="price"&&<PriceComparison totalSize={d.totalSize}/>}
      {tab==="dev"&&<DevResources/>}

      {tab==="sp"&&d.nodes.length>0&&!search&&(
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-xl border border-border bg-surface/50 backdrop-blur">
            <h2 className="text-xs font-semibold text-text3 uppercase tracking-wider mb-3">SP Active Slots Comparison</h2>
            <div className="space-y-1.5">
              {d.nodes.slice(0,10).map(sp=>{const maxSlots=Math.max(...d.nodes.map(n=>n.activeSlots),1);const w=(sp.activeSlots/maxSlots)*100;return(
                <div key={sp.address} className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-text3 w-16 truncate">{short(sp.address)}</span>
                  <div className="flex-1 h-3 bg-border rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{width:`${w}%`}}/></div>
                  <span className="font-mono text-accent font-semibold w-6 text-right">{sp.activeSlots}</span>
                </div>
              );})}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface/50 backdrop-blur">
            <h2 className="text-xs font-semibold text-text3 uppercase tracking-wider mb-3">Network Topology</h2>
            <div className="relative mx-auto" style={{width:280,height:280}}>
              <div className="absolute inset-4 rounded-full border-2 border-border/40"/>
              <div className="absolute inset-12 rounded-full border border-dashed border-border/30"/>
              <div className="absolute inset-20 rounded-full border border-border/20"/>
              {d.nodes.slice(0,8).map((sp,i)=>{const angle=(i/d.nodes.slice(0,8).length)*Math.PI*2-Math.PI/2;const r=100;const x=140+Math.cos(angle)*r;const y=140+Math.sin(angle)*r;const size=Math.max(24,Math.min(48,20+sp.activeSlots*4));return(
                <div key={sp.address} className="absolute flex flex-col items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 transition-all hover:scale-110 cursor-help" style={{left:x-size/2,top:y-size/2,width:size,height:size}} title={`${sp.address}\nActive: ${sp.activeSlots}/${sp.totalSlots} slots`}>
                  <span className="font-mono text-[8px] font-bold text-accent">{short(sp.address).slice(0,4)}</span>
                  <span className="font-mono text-[7px] text-text3">{sp.activeSlots}</span>
                </div>
              );})}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="font-mono text-[10px] font-bold text-accent">ShelbyNet</div>
                <div className="font-mono text-[8px] text-text3">{d.activeSPs} SPs</div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-3 text-[10px] text-text3">
              <span>Size = active slots</span>
              <span>{d.nodes.length} nodes total</span>
              {d.nodes.length>8&&<span>Showing top 8</span>}
            </div>
          </div>
        </div>
      )}

      {search&&tab==="sp"&&d.nodes.length===0&&<div className="py-12 text-center text-text3 text-sm">No SP nodes found for &ldquo;{search}&rdquo;.</div>}

      <p className="font-mono text-[10px] text-text3 mt-10 text-right">ShelbyNet GraphQL &middot; {new Date().toLocaleString()}</p>
    </div>
  );
}

// ── Stat Box ──
function StatBox({label,value,sub,accent,change}:{label:string;value:string;sub?:string;accent?:boolean;change?:{val:string;up:boolean}}) {
  return (
    <div className="bg-surface/70 backdrop-blur border border-border rounded-xl p-3 sm:p-4 hover:border-border-hover transition-colors">
      <div className={`text-lg sm:text-xl font-extrabold leading-none mb-0.5 ${accent?"text-accent":"text-text"}`}>{value}</div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] sm:text-[10px] font-medium text-text3 uppercase tracking-wide">{label}</span>
        {change&&<span className={`text-[9px] font-semibold ${change.up?"text-green-400":"text-red-400"}`}>{change.up?"↑":"↓"}{change.val}</span>}
      </div>
      {sub&&<div className="text-[9px] sm:text-[10px] text-text3 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── SP Table ──
function SPTable({nodes,search}:{nodes:{address:string;activeSlots:number;totalSlots:number;joiningSlots:number;vacatedSlots:number;lastSeen:number}[],search:string}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3 uppercase tracking-wider">
          <th className="py-3 pl-4 pr-2 font-medium">SP Address</th><th className="py-3 px-2 font-medium text-right">Active</th><th className="py-3 px-2 font-medium text-right">Joining</th><th className="py-3 px-2 font-medium text-right">Vacated</th><th className="py-3 px-2 font-medium hidden sm:table-cell">Active Rate</th><th className="py-3 px-2 font-medium text-right">Health</th><th className="py-3 pr-4 pl-2 font-medium text-right">Last Seen</th>
        </tr></thead>
        <tbody>
          {nodes.map(sp=>{
            const pct=sp.totalSlots>0?(sp.activeSlots/sp.totalSlots)*100:0;
            const hoursAgo=sp.lastSeen?(Date.now()-sp.lastSeen/1000)/3600000:999;
            const recencyScore=Math.max(0,100-hoursAgo*10);
            const healthScore=Math.round(pct*0.6+recencyScore*0.4);
            const hc=healthScore>=80?"text-green-400":healthScore>=50?"text-yellow-400":"text-red-400";
            return (
              <tr key={sp.address} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="py-2.5 pl-4 pr-2"><Link href={`/tools/sp-explorer/${sp.address}`} className="font-mono text-text2 hover:text-accent transition-colors" title={sp.address}>{short(sp.address)}</Link></td>
                <td className="py-2.5 px-2 font-mono text-green-400 font-semibold text-right">{sp.activeSlots}</td>
                <td className="py-2.5 px-2 font-mono text-yellow-400 text-right">{sp.joiningSlots||"—"}</td>
                <td className="py-2.5 px-2 font-mono text-red-400 text-right">{sp.vacatedSlots||"—"}</td>
                <td className="py-2.5 px-2 hidden sm:table-cell"><div className="flex items-center gap-2"><div className="w-full h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{width:`${Math.min(100,pct)}%`}}/></div><span className="font-mono text-[10px] text-text3 w-8 text-right">{Math.round(pct)}%</span></div></td>
                <td className="py-2.5 px-2 text-right"><span className={`font-mono text-[10px] font-bold ${hc}`}>{healthScore}</span></td>
                <td className="py-2.5 pr-4 pl-2 font-mono text-text3 text-right text-[10px]">{ago(sp.lastSeen)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {search&&nodes.length>0&&<div className="px-4 py-2 text-[10px] text-text3 bg-surface border-t border-border">{nodes.length} results</div>}
    </div>
  );
}

// ── Blob Tab ──
function BlobTab({topBlobs,recentBlobs}:{topBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],recentBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[]}) {
  return (
    <div className="space-y-8">
      <div><h2 className="text-sm font-extrabold mb-3">Recent Uploads <span className="text-text3 font-normal text-xs">({recentBlobs.length})</span></h2><BlobTable blobs={recentBlobs} showTime/></div>
      <div><h2 className="text-sm font-extrabold mb-3">Largest Blobs <span className="text-text3 font-normal text-xs">({topBlobs.length})</span></h2><BlobTable blobs={topBlobs}/></div>
      <FileStats blobs={topBlobs}/>
    </div>
  );
}

function BlobTable({blobs,showTime}:{blobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],showTime?:boolean}) {
  if(!blobs||blobs.length===0)return<div className="py-12 text-center text-text3 text-sm">No data.</div>;
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3 uppercase tracking-wider">
          <th className="py-2.5 pl-4 pr-2 font-medium w-8">#</th><th className="py-2.5 px-2 font-medium">Name</th><th className="py-2.5 px-2 font-medium text-right">Size</th><th className="py-2.5 px-2 font-medium">Status</th><th className="py-2.5 px-2 font-medium hidden sm:table-cell">Owner</th><th className="py-2.5 px-2 font-medium text-right">Chunks</th>{showTime&&<th className="py-2.5 pr-4 pl-2 font-medium text-right">Age</th>}
        </tr></thead>
        <tbody>
          {blobs.map((b,i)=>{
            const deleted=b.isDeleted,written=b.isWritten!==false,expSoon=b.expires&&parseInt(b.expires,10)<Date.now()*1000+86400_000_000;
            let badge,badgeStyle;
            if(deleted){badge="Deleted";badgeStyle="bg-red-500/10 text-red-400 border-red-500/30";}
            else if(!written){badge="Writing";badgeStyle="bg-yellow-500/10 text-yellow-400 border-yellow-500/30";}
            else if(expSoon){badge="Expiring";badgeStyle="bg-yellow-500/10 text-yellow-400 border-yellow-500/30";}
            else{badge="Active";badgeStyle="bg-green-500/10 text-green-400 border-green-500/30";}
            return (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="py-2 pl-4 pr-2 font-mono text-text3">{i+1}</td>
                <td className="py-2 px-2 text-text2 truncate max-w-[180px] sm:max-w-[300px]" title={b.name}>{shortName(b.name)}</td>
                <td className="py-2 px-2 font-mono text-accent font-semibold text-right">{fmtB(b.size)}</td>
                <td className="py-2 px-2"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${badgeStyle}`}>{badge}</span></td>
                <td className="py-2 px-2 font-mono text-text3 text-[10px] hidden sm:table-cell"><Link href={`/tools/sp-explorer/owner/${b.owner}`} className="hover:text-accent transition-colors">{short(b.owner)}</Link></td>
                <td className="py-2 px-2 font-mono text-text3 text-right">{b.chunksets}</td>
                {showTime&&<td className="py-2 pr-4 pl-2 font-mono text-text3 text-right text-[10px]">{ago(parseInt(b.created,10)/1000)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FileStats({blobs}:{blobs:{name:string;size:number}[]}) {
  const types:Record<string,{count:number;size:number}>={};
  for(const b of blobs){const ext=b.name.split(".").pop()?.toLowerCase()||"other";const cat=/^(mp4|mkv|avi|mov|webm)$/.test(ext)?"Video":/^(jpg|jpeg|png|gif|webp|svg)$/.test(ext)?"Image":/^(pdf|doc|docx|txt|md|csv|json|xml)$/.test(ext)?"Document":/^(rar|zip|gz|tar|7z)$/.test(ext)?"Archive":"Other";if(!types[cat])types[cat]={count:0,size:0};types[cat].count+=1;types[cat].size+=b.size;}
  const sorted=Object.entries(types).sort((a,b)=>b[1].size-a[1].size);
  return (
    <div>
      <h2 className="text-sm font-extrabold mb-3">File Type Distribution</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {sorted.map(([cat,s])=>(<div key={cat} className="p-3 sm:p-4 rounded-xl border border-border bg-surface/70 backdrop-blur hover:border-border-hover transition-colors"><div className="font-bold text-sm mb-1">{cat}</div><div className="font-mono text-xs text-accent">{fmtB(s.size)}</div><div className="text-[10px] text-text3 mt-0.5">{s.count} files</div></div>))}
      </div>
    </div>
  );
}

// ── Events Table ──
function EventsTable({events}:{events:{name:string;owner:string;type:string;time:string;hash?:string}[]}) {
  if(!events||events.length===0)return<div className="py-16 text-center text-text3 text-sm">No event data.</div>;
  return (
    <div>
      <p className="text-xs text-text2 mb-3">Latest {events.length} on-chain events.</p>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3 uppercase tracking-wider">
            <th className="py-2.5 pl-4 pr-2 font-medium">Type</th><th className="py-2.5 px-2 font-medium">Blob Name</th><th className="py-2.5 px-2 font-medium hidden sm:table-cell">TX Hash</th><th className="py-2.5 pr-4 pl-2 font-medium text-right">Time</th>
          </tr></thead>
          <tbody>
            {events.map((e,i)=>{const c=e.type?.includes("Registered")?"bg-green-500/10 text-green-400 border-green-500/30":e.type?.includes("Written")?"bg-blue-500/10 text-blue-400 border-blue-500/30":"bg-surface2 text-text3 border-border";return(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="py-2 pl-4 pr-2"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${c}`}>{e.type||"Event"}</span></td>
                <td className="py-2 px-2 text-text2 truncate max-w-[200px] sm:max-w-[350px]" title={e.name}>{shortName(e.name)}</td>
                <td className="py-2 px-2 hidden sm:table-cell"><span className="font-mono text-[10px] text-text3" title={e.hash}>{e.hash?short(e.hash):"—"}</span></td>
                <td className="py-2 pr-4 pl-2 font-mono text-text3 text-right text-[10px]">{e.time?new Date(e.time).toLocaleString():"—"}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dev Resources ──
function DevResources() {
  const links=[{title:"Shelby Website",desc:"Project homepage",href:"https://shelby.xyz"},{title:"Developer Docs",desc:"SDK, CLI, API reference",href:"https://docs.shelby.xyz"},{title:"GitHub",desc:"Examples and SDK source",href:"https://github.com/shelby/examples"},{title:"Early Access",desc:"Apply for developer access",href:"https://developers.shelby.xyz"},{title:"Discord",desc:"Official community",href:"https://discord.gg/shelbyserves"},{title:"X / Twitter",desc:"@shelbyserves",href:"https://x.com/shelbyserves"}];
  const pkgs=[{name:"@shelby-protocol/sdk",desc:"TypeScript SDK",cmd:"npm install @shelby-protocol/sdk"},{name:"@shelby-protocol/cli",desc:"CLI tool",cmd:"npm install -g @shelby-protocol/cli"},{name:"shelby-mcp",desc:"AI Agent MCP Server",cmd:"npx shelbymcp"},{name:"x402s",desc:"x402 payment bridge",cmd:"npm install x402s"}];
  return (
    <div className="space-y-8">
      <div><h2 className="text-sm font-extrabold mb-4">Developer Resources</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {links.map(l=>(<a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur hover:border-accent/30 hover:bg-surface transition-all group"><h3 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{l.title}</h3><p className="text-xs text-text3">{l.desc}</p></a>))}
        </div>
      </div>
      <div><h2 className="text-sm font-extrabold mb-4">SDK Installation</h2>
        <div className="space-y-2">
          {pkgs.map(p=>(<div key={p.name} className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><span className="font-mono text-xs text-accent font-semibold">{p.name}</span><span className="text-xs text-text3 ml-2">{p.desc}</span></div><code className="font-mono text-[11px] text-text2 bg-surface2 px-3 py-1 rounded select-all">{p.cmd}</code></div>))}
        </div>
      </div>
      <div className="p-4 rounded-xl border border-border bg-surface/70 backdrop-blur space-y-3">
        <div><h2 className="text-sm font-extrabold mb-2">REST API</h2><p className="text-xs text-text2 mb-2">Programmatic access to network data:</p><code className="font-mono text-[11px] text-accent bg-surface2 px-3 py-1.5 rounded select-all block">GET /api/network-stats</code><a href="/api/network-stats" target="_blank" className="font-mono text-[10px] text-text3 hover:text-accent transition-colors mt-1 inline-block">Open test &rarr;</a></div>
        <div className="pt-3 border-t border-border"><h2 className="text-sm font-extrabold mb-2">About ShelbyNet</h2><p className="text-xs text-text2 leading-relaxed">ShelbyNet is the public testnet of the Shelby Protocol, maintained by Aptos Labs and Jump Crypto. The Data Plane runs on the DoubleZero fiber backbone; the Control Plane uses Aptos for settlement and verification. Testnet data has no persistence guarantee &mdash; it may be reset before mainnet launch.</p></div>
      </div>
    </div>
  );
}

// ── Price Comparison ──
function PriceComparison({totalSize}:{totalSize:number}) {
  const gb=totalSize>0?totalSize/(1024**3):0;
  const shelbyCost=gb*0.01,awsCost=gb*0.073;
  const savings=awsCost>0?Math.round((1-shelbyCost/awsCost)*100):70;
  return (
    <div>
      <p className="text-xs text-text2 mb-4">Real-time cost estimate based on {fmtB(totalSize)} of network data. Actual costs vary with read frequency.</p>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface/70 backdrop-blur text-center"><div className="text-text3 text-xs mb-1">AWS S3</div><div className="font-mono text-xl sm:text-2xl font-extrabold text-red-400">${awsCost.toFixed(2)}</div><div className="text-[10px] text-text3 mt-1">$0.023/GB + $0.05/GB egress</div></div>
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface/70 backdrop-blur text-center"><div className="text-text3 text-xs mb-1">Shelby</div><div className="font-mono text-xl sm:text-2xl font-extrabold text-green-400">${shelbyCost.toFixed(2)}</div><div className="text-[10px] text-text3 mt-1">$0.01/GB write + $0.014/GB read</div></div>
        <div className="p-4 sm:p-5 rounded-xl border border-accent/30 bg-accent/5 backdrop-blur text-center"><div className="text-text3 text-xs mb-1">Savings</div><div className="font-mono text-xl sm:text-2xl font-extrabold text-accent">~{savings}%</div><div className="text-[10px] text-text3 mt-1">vs AWS total cost</div></div>
      </div>
      <a href="/tools/sp-calculator" className="font-mono text-xs text-accent hover:underline">SP Profit Calculator &rarr;</a>
    </div>
  );
}
