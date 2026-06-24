import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";
import { AutoRefresh } from "@/components/AutoRefresh";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer", description: "SP nodes, blobs, events — raw ShelbyNet data." };

function fmtB(b: number): string {
  if (!b) return "0"; const u=["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(i>0?1:0)}${u[i]}`;
}
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,6)}...${a.slice(-4)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,30)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ sort?:string;search?:string;tab?:string}> }) {
  const sp = await searchParams;
  const sort=sp.sort??"active",search=sp.search??"",tab=sp.tab??"sp";
  const d = await getShelbyData(sort,search);

  // Network health: based on active SPs/total, recent growth, indexer uptime
  const spHealth = d.totalSPs>0 ? (d.activeSPs/d.totalSPs)*100 : 0;
  const growthRate = d.blobCount>0 ? (d.growth.dayBlobs/d.blobCount)*100 : 0;
  const healthScore = Math.round(spHealth*0.4 + (d.status?40:0) + Math.min(growthRate*5,20));

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <KeyboardShortcuts currentTab={tab} />
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ShelbyNet</h1>
          <p className="text-xs text-text3 font-mono mt-0.5">
            {fmtN(d.blobCount)} blobs &middot; {fmtB(d.totalSize)} &middot; {fmtN(d.activityCount)} ops &middot; {d.activeSPs}/{d.totalSPs} SPs
          </p>
          <p className="text-[10px] text-text3 font-mono mt-0.5">
            24h +{fmtN(d.growth.dayBlobs)} blobs ({fmtB(d.growth.daySize)}) &middot; 7d +{fmtN(d.growth.weekBlobs)} blobs &middot;
            health <span className={healthScore>=70?"text-green-400":healthScore>=40?"text-yellow-400":"text-red-400"}>{healthScore}/100</span>
            {!d.status&&<span className="text-red-400 ml-1">· indexer down</span>}
          </p>
        </div>
        <div className="text-right">
          <AutoRefresh interval={30} />
        </div>
      </div>

      {/* Growth anomaly warning */}
      {d.growth.dayBlobs > d.growth.weekBlobs * 0.3 && (
        <div className="mb-4 p-2 border border-accent/30 bg-accent/5 text-[10px] font-mono text-accent">
          high activity: 24h volume ({fmtN(d.growth.dayBlobs)}) is &gt;30% of weekly ({fmtN(d.growth.weekBlobs)})
        </div>
      )}

      {d.error && <div className="p-3 mb-5 border border-red-500/30 bg-red-500/5 text-xs text-red-400 font-mono">{d.error}</div>}

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-border">
        {[{k:"sp",l:"SPs"},{k:"blobs",l:"Blobs"},{k:"events",l:"Events"},{k:"price",l:"Cost"},{k:"dev",l:"Dev"}].map(t=>(
          <a key={t.k} href={`?tab=${t.k}&sort=${sort}`} className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-[1px] transition-colors ${tab===t.k?"border-accent text-text":"border-transparent text-text3 hover:text-text2"}`}>{t.l}</a>
        ))}
        <a href="/tools/sp-explorer/map" className="px-3 py-1.5 text-xs font-medium border-b-2 border-transparent text-text3 hover:text-text2 -mb-[1px]">Map</a>
        <a href="/api/network-stats" className="px-3 py-1.5 text-xs font-medium border-b-2 border-transparent text-text3 hover:text-text2 -mb-[1px] font-mono">JSON</a>
      </div>

      {/* Toolbar — only show for SP/blobs tabs */}
      {tab!=="dev"&&tab!=="price"&&(
        <div className="flex gap-2 mb-4">
          <form className="flex-1 flex gap-2">
            <input name="search" defaultValue={search} placeholder={tab==="blobs"?"blob name...":"sp 0x..."}
              className="flex-1 px-2.5 py-1.5 text-xs border border-border bg-surface text-text placeholder:text-text3 focus:outline-none focus:border-accent font-mono"/>
            <input type="hidden" name="tab" value={tab}/>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-accent text-white hover:brightness-110 transition-colors">search</button>
            {search&&<a href={`?tab=${tab}&sort=${sort}`} className="px-2.5 py-1.5 text-xs border border-border text-text3 hover:text-text transition-colors">clear</a>}
          </form>
          {tab==="sp"&&<>
            <a href="?tab=sp&sort=active" className={`text-[10px] px-2 py-1.5 border font-mono transition-colors ${sort==="active"&&!search?"border-accent text-accent":"border-border text-text3 hover:text-text"}`}>active</a>
            <a href="?tab=sp&sort=total" className={`text-[10px] px-2 py-1.5 border font-mono transition-colors ${sort==="total"&&!search?"border-accent text-accent":"border-border text-text3 hover:text-text"}`}>total</a>
          </>}
          <a href="/api/export-sp" className="text-[10px] px-2 py-1.5 border border-border text-text3 hover:text-accent transition-colors font-mono">csv</a>
        </div>
      )}

      {/* Content */}
      {tab==="sp"&&<SPTable nodes={d.nodes} search={search}/>}
      {tab==="blobs"&&<BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs}/>}
      {tab==="events"&&<EventsTable events={d.events}/>}
      {tab==="price"&&<PriceSection totalSize={d.totalSize} blobCount={d.blobCount} growth={d.growth}/>}
      {tab==="dev"&&<DevSection/>}

      <p className="font-mono text-[10px] text-text3 mt-10">{new Date().toISOString()} &middot; shelbynet graphql</p>
    </div>
  );
}

// ── SP Table ──
function SPTable({nodes,search}:{nodes:{address:string;activeSlots:number;totalSlots:number;joiningSlots:number;vacatedSlots:number;lastSeen:number}[],search:string}) {
  if (nodes.length===0) return <div className="py-16 text-center text-text3 text-xs">{search?"no match":"no SPs found"}</div>;

  return (
    <div>
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
            <th className="py-2 pl-3 pr-2 font-medium w-[140px]">address</th>
            <th className="py-2 px-2 font-medium text-right w-14">active</th>
            <th className="py-2 px-2 font-medium text-right w-12">join</th>
            <th className="py-2 px-2 font-medium text-right w-14">vacated</th>
            <th className="py-2 px-2 font-medium hidden sm:table-cell">active %</th>
            <th className="py-2 px-2 font-medium text-right w-14">health</th>
            <th className="py-2 pr-3 pl-2 font-medium text-right w-16">seen</th>
          </tr></thead>
          <tbody>
            {nodes.map((sp,i)=>{
              const pct=sp.totalSlots>0?Math.round((sp.activeSlots/sp.totalSlots)*100):0;
              const hoursAgo=sp.lastSeen?(Date.now()-sp.lastSeen/1000)/3600000:999;
              const healthScore=Math.round(pct*0.6+Math.max(0,100-hoursAgo*10)*0.4);
              const hc=healthScore>=80?"text-green-400":healthScore>=50?"text-yellow-400":"text-red-400";
              const recentlySeen = sp.lastSeen && (Date.now()-sp.lastSeen/1000) < 600_000; // 10 min
              return (
                <tr key={sp.address} className={`border-b border-border last:border-0 hover:bg-surface transition-colors ${i%2===0?"bg-transparent":"bg-surface/30"}`}>
                  <td className="py-1.5 pl-3 pr-2">
                  <div className="flex items-center gap-1">
                    <Link href={`/tools/sp-explorer/${sp.address}`} className="font-mono text-text2 hover:text-accent transition-colors" title={sp.address}>
                      {short(sp.address)}
                    </Link>
                    <CopyButton text={sp.address} label="copy" />
                    {recentlySeen&&<span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shrink-0" title="active <10min"/>}
                  </div>
                </td>
                  <td className="py-1.5 px-2 font-mono text-green-400 font-semibold text-right">{sp.activeSlots}</td>
                  <td className="py-1.5 px-2 font-mono text-yellow-400 text-right">{sp.joiningSlots||"—"}</td>
                  <td className="py-1.5 px-2 font-mono text-red-400 text-right">{sp.vacatedSlots||"—"}</td>
                  <td className="py-1.5 px-2 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-border"><div className="h-full bg-accent" style={{width:`${pct}%`}}/></div>
                      <span className="font-mono text-[10px] text-text3">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right"><span className={`font-mono text-[10px] font-bold ${hc}`}>{healthScore}</span></td>
                  <td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right">{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-text3 font-mono mt-1.5">{nodes.length} SP{nodes.length>1?"s":""}{search?` matching "${search}"`:""}</p>
    </div>
  );
}

// ── Blobs ──
function BlobSection({topBlobs,recentBlobs}:{topBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],recentBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[]}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-text3 uppercase tracking-wide">Recent ({recentBlobs.length})</h2>
          <span className="text-[9px] text-text3">by created_at desc</span>
        </div>
        <BlobTable blobs={recentBlobs} showTime/>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-text3 uppercase tracking-wide">Largest ({topBlobs.length})</h2>
          <span className="text-[9px] text-text3">by size desc</span>
        </div>
        <BlobTable blobs={topBlobs}/>
      </div>
      <FileTypeBreakdown blobs={topBlobs}/>
    </div>
  );
}

function BlobTable({blobs,showTime}:{blobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],showTime?:boolean}) {
  if(!blobs||blobs.length===0)return<div className="py-8 text-center text-text3 text-xs border border-border">none</div>;
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
          <th className="py-1.5 pl-3 pr-2 w-6">#</th>
          <th className="py-1.5 px-2">name</th>
          <th className="py-1.5 px-2 text-right w-20">size</th>
          <th className="py-1.5 px-2 w-14">st</th>
          <th className="py-1.5 px-2 hidden sm:table-cell">owner</th>
          <th className="py-1.5 px-2 text-right w-14">chunks</th>
          {showTime&&<th className="py-1.5 pr-3 pl-2 text-right w-14">age</th>}
        </tr></thead>
        <tbody>
          {blobs.map((b,i)=>{
            const d=b.isDeleted,w=b.isWritten!==false,e=b.expires&&parseInt(b.expires,10)<Date.now()*1000+86400_000_000;
            let badge="ok",bs="text-green-400";
            if(d){badge="del";bs="text-red-400"}else if(!w){badge="wip";bs="text-yellow-400"}else if(e){badge="exp";bs="text-yellow-400"};
            return(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="py-1.5 pl-3 pr-2 font-mono text-text3">{i+1}</td>
                <td className="py-1.5 px-2 truncate max-w-[180px] sm:max-w-[300px]" title={b.name}>
                  <Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="text-text2 hover:text-accent transition-colors">{shortName(b.name)}</Link>
                </td>
                <td className="py-1.5 px-2 font-mono text-accent font-semibold text-right">{fmtB(b.size)}</td>
                <td className="py-1.5 px-2"><span className={`font-mono text-[9px] ${bs}`}>{badge}</span></td>
                <td className="py-1.5 px-2 hidden sm:table-cell"><Link href={`/tools/sp-explorer/owner/${b.owner}`} className="font-mono text-text3 hover:text-accent transition-colors">{short(b.owner)}</Link></td>
                <td className="py-1.5 px-2 font-mono text-text3 text-right">{b.chunksets}</td>
                {showTime&&<td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right">{ago(parseInt(b.created,10)/1000)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FileTypeBreakdown({blobs}:{blobs:{name:string;size:number}[]}) {
  const types:Record<string,{count:number;size:number}>={};
  for(const b of blobs){const ext=b.name.split(".").pop()?.toLowerCase()||"";const cat=/^(mp4|mkv|avi|mov|webm)$/.test(ext)?"video":/^(jpg|jpeg|png|gif|webp|svg)$/.test(ext)?"image":/^(pdf|doc|docx|txt|md|csv|json|xml)$/.test(ext)?"doc":/^(rar|zip|gz|tar|7z)$/.test(ext)?"archive":"other";if(!types[cat])types[cat]={count:0,size:0};types[cat].count+=1;types[cat].size+=b.size;}
  const sorted=Object.entries(types).sort((a,b)=>b[1].size-a[1].size);
  return (
    <div>
      <h2 className="text-xs font-bold mb-2 text-text3 uppercase tracking-wide">File Types</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
        {sorted.map(([cat,s])=>(
          <div key={cat} className="border border-border p-2 text-center">
            <div className="font-bold text-xs">{cat}</div>
            <div className="font-mono text-[10px] text-accent mt-0.5">{fmtB(s.size)}</div>
            <div className="text-[9px] text-text3">{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events ──
function EventsTable({events}:{events:{name:string;owner:string;type:string;time:string;hash?:string}[]}) {
  if(!events||events.length===0)return<div className="py-16 text-center text-text3 text-xs border border-border">no recent events</div>;
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
          <th className="py-1.5 pl-3 pr-2 w-20">type</th>
          <th className="py-1.5 px-2">blob</th>
          <th className="py-1.5 px-2 hidden sm:table-cell">owner</th>
          <th className="py-1.5 pr-3 pl-2 text-right w-36">time</th>
        </tr></thead>
        <tbody>
          {events.map((e,i)=>(
            <tr key={i} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-1.5 pl-3 pr-2"><span className="font-mono text-[9px] text-text3">{e.type||"—"}</span></td>
              <td className="py-1.5 px-2 truncate max-w-[200px] sm:max-w-[350px]" title={e.name}>
                <Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} className="text-text2 hover:text-accent transition-colors">{shortName(e.name)}</Link>
              </td>
              <td className="py-1.5 px-2 hidden sm:table-cell"><Link href={`/tools/sp-explorer/owner/${e.owner}`} className="font-mono text-text3 hover:text-accent transition-colors">{short(e.owner)}</Link></td>
              <td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right">{e.time?new Date(e.time).toLocaleString():"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Price ──
function PriceSection({totalSize,blobCount,growth}:{totalSize:number;blobCount:number;growth:{weekBlobs:number;weekSize:number;dayBlobs:number;daySize:number}}) {
  const gb=totalSize>0?totalSize/(1024**3):0;
  const shelby=gb*0.01,aws=gb*0.073;
  const pct=aws>0?Math.round((1-shelby/aws)*100):70;
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 mb-4">
        <div className="border border-border p-4 text-center"><div className="text-xs text-text3 mb-1">AWS S3 (est)</div><div className="font-mono font-bold text-red-400">${aws.toFixed(0)}</div><div className="text-[9px] text-text3 mt-0.5">$0.023+$0.05/GB</div></div>
        <div className="border border-border p-4 text-center"><div className="text-xs text-text3 mb-1">Shelby (est)</div><div className="font-mono font-bold text-green-400">${shelby.toFixed(0)}</div><div className="text-[9px] text-text3 mt-0.5">$0.01+$0.014/GB</div></div>
        <div className="border border-accent/30 bg-accent/5 p-4 text-center"><div className="text-xs text-text3 mb-1">vs AWS</div><div className="font-mono font-bold text-accent">~{pct}% less</div><div className="text-[9px] text-text3 mt-0.5">{fmtB(totalSize)} total</div></div>
      </div>
      <div className="border border-border p-3 text-xs text-text3 mb-4">
        <span className="font-medium text-text2">Growth: </span>
        7d: +{fmtN(growth.weekBlobs)} blobs ({fmtB(growth.weekSize)}) &middot; 24h: +{fmtN(growth.dayBlobs)} blobs ({fmtB(growth.daySize)})
      </div>
      <a href="https://shelbycn.com/tools/sp-calculator" className="font-mono text-[10px] text-text3 hover:text-accent transition-colors">detailed calculator → shelbycn.com</a>
    </div>
  );
}

// ── Dev ──
function DevSection() {
  const links=[{n:"docs.shelby.xyz",h:"https://docs.shelby.xyz"},{n:"github.com/shelby",h:"https://github.com/shelby/examples"},{n:"developers.shelby.xyz",h:"https://developers.shelby.xyz"},{n:"discord.gg/shelbyserves",h:"https://discord.gg/shelbyserves"}];
  const pkgs=["@shelby-protocol/sdk","@shelby-protocol/cli","shelby-mcp","x402s"];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1">
        {links.map(l=><a key={l.h} href={l.h} target="_blank" rel="noopener noreferrer" className="border border-border p-3 hover:bg-surface transition-colors text-xs"><span className="font-bold">{l.n}</span></a>)}
      </div>
      <div>
        <h2 className="text-xs font-bold mb-2 text-text3 uppercase tracking-wide">Install</h2>
        <div className="space-y-1">
          {pkgs.map(p=><div key={p} className="border border-border p-2.5 font-mono text-xs text-text2"><span className="text-text3">$ </span>npm i {p}</div>)}
        </div>
      </div>
      <div className="border border-border p-3 text-xs text-text3">
        <span className="font-medium text-text2">ShelbyNet</span> — public testnet. Data Plane: DoubleZero fiber. Control Plane: Aptos. No persistence guarantees. <span className="text-text2">API:</span> <code className="font-mono text-accent">GET /api/network-stats</code>
      </div>
    </div>
  );
}
