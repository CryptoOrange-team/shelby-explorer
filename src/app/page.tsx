import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer", description: "Storage providers, blobs, events. Raw on-chain data from ShelbyNet." };

function fmtB(b: number): string {
  if (!b) return "0";
  const u = ["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++}
  return `${v.toFixed(i>0?1:0)}${u[i]}`;
}
function fmtN(n: number): string {
  if (n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n>=1_000) return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function short(a:string):string{return`${a.slice(0,6)}...${a.slice(-4)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,30)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{ sort?:string;search?:string;tab?:string}> }) {
  const sp = await searchParams;
  const sort=sp.sort??"active",search=sp.search??"",tab=sp.tab??"sp";
  const d = await getShelbyData(sort,search);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ShelbyNet</h1>
          <p className="text-xs text-text3 font-mono mt-0.5">{fmtN(d.blobCount)} blobs &middot; {fmtB(d.totalSize)} &middot; {d.activeSPs}/{d.totalSPs} SPs active</p>
        </div>
        <AutoRefresh interval={30} />
      </div>

      {d.error && <div className="p-3 mb-6 border border-red-500/30 bg-red-500/5 text-xs text-red-400">{d.error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-6">
        <StatBox label="Blobs" value={fmtN(d.blobCount)} change={d.growth.dayBlobs>0?`+${fmtN(d.growth.dayBlobs)}/24h`:"—"} />
        <StatBox label="Storage" value={fmtB(d.totalSize)} />
        <StatBox label="Activities" value={fmtN(d.activityCount)} />
        <StatBox label="SPs" value={`${d.activeSPs}/${d.totalSPs}`} />
        <StatBox label="Slots" value={`${d.activeSlots}/${d.totalSlots}`} />
        <StatBox label="Indexer" value={d.status?"up":"down"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-3 border-b border-border">
        {["sp","blobs","events","price","dev"].map(k=>{
          const labels:Record<string,string>={sp:"SP Nodes",blobs:"Blobs",events:"Events",price:"Cost",dev:"Dev"};
          const active=tab===k;
          return <a key={k} href={`?tab=${k}&sort=${sort}`}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-[1px] transition-colors ${active?"border-accent text-text":"border-transparent text-text3 hover:text-text2"}`}>{labels[k]}</a>;
        })}
        <a href="/tools/sp-explorer/map" className="px-3 py-1.5 text-xs font-medium border-b-2 border-transparent text-text3 hover:text-text2 -mb-[1px]">Map</a>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        <form className="flex-1 flex gap-2">
          <input name="search" defaultValue={search} placeholder={tab==="blobs"?"blob name...":"sp address 0x..."}
            className="flex-1 px-2.5 py-1.5 text-xs border border-border bg-surface text-text placeholder:text-text3 focus:outline-none focus:border-accent font-mono"/>
          <input type="hidden" name="tab" value={tab}/>
          <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-accent text-white hover:brightness-110 transition-colors">Search</button>
          {search&&<a href={`?tab=${tab}&sort=${sort}`} className="px-2.5 py-1.5 text-xs border border-border text-text3 hover:text-text transition-colors">x</a>}
        </form>
        <a href="?tab=sp&sort=active" className={`text-[10px] px-2 py-1.5 border font-mono transition-colors ${sort==="active"&&!search?"border-accent text-accent":"border-border text-text3 hover:text-text"}`}>active</a>
        <a href="?tab=sp&sort=total" className={`text-[10px] px-2 py-1.5 border font-mono transition-colors ${sort==="total"&&!search?"border-accent text-accent":"border-border text-text3 hover:text-text"}`}>total</a>
        <a href="/api/export-sp" className="text-[10px] px-2 py-1.5 border border-border text-text3 hover:text-accent transition-colors font-mono">csv</a>
      </div>

      {/* Content */}
      {tab==="sp"&&<SPTable nodes={d.nodes} search={search}/>}
      {tab==="blobs"&&<BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs}/>}
      {tab==="events"&&<EventsTable events={d.events}/>}
      {tab==="price"&&<PriceSection totalSize={d.totalSize} blobCount={d.blobCount}/>}
      {tab==="dev"&&<DevSection/>}

      <p className="font-mono text-[10px] text-text3 mt-8">data: shelbynet graphql &middot; {new Date().toISOString()}</p>
    </div>
  );
}

// ── Stat Box ──
function StatBox({label,value,change}:{label:string;value:string;change?:string}) {
  return (
    <div className="border border-border p-2.5">
      <div className="text-xs font-bold">{value}</div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[9px] text-text3 uppercase tracking-wide">{label}</span>
        {change&&<span className="text-[9px] text-accent font-medium">{change}</span>}
      </div>
    </div>
  );
}

// ── SP Table ──
function SPTable({nodes,search}:{nodes:{address:string;activeSlots:number;totalSlots:number;joiningSlots:number;vacatedSlots:number;lastSeen:number}[],search:string}) {
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
          <th className="py-2 pl-3 pr-2 font-medium">address</th><th className="py-2 px-2 font-medium text-right">active</th><th className="py-2 px-2 font-medium text-right">join</th><th className="py-2 px-2 font-medium text-right">vacated</th><th className="py-2 px-2 font-medium hidden sm:table-cell">rate</th><th className="py-2 px-2 font-medium text-right">health</th><th className="py-2 pr-3 pl-2 font-medium text-right">seen</th>
        </tr></thead>
        <tbody>
          {nodes.map(sp=>{
            const pct=sp.totalSlots>0?(sp.activeSlots/sp.totalSlots)*100:0;
            const hoursAgo=sp.lastSeen?(Date.now()-sp.lastSeen/1000)/3600000:999;
            const healthScore=Math.round(pct*0.6+Math.max(0,100-hoursAgo*10)*0.4);
            const hc=healthScore>=80?"text-green-400":healthScore>=50?"text-yellow-400":"text-red-400";
            return (
              <tr key={sp.address} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="py-1.5 pl-3 pr-2"><Link href={`/tools/sp-explorer/${sp.address}`} className="font-mono text-text2 hover:text-accent transition-colors" title={sp.address}>{short(sp.address)}</Link></td>
                <td className="py-1.5 px-2 font-mono text-green-400 font-semibold text-right">{sp.activeSlots}</td>
                <td className="py-1.5 px-2 font-mono text-yellow-400 text-right">{sp.joiningSlots||"—"}</td>
                <td className="py-1.5 px-2 font-mono text-red-400 text-right">{sp.vacatedSlots||"—"}</td>
                <td className="py-1.5 px-2 hidden sm:table-cell"><span className="font-mono text-[10px] text-text3">{Math.round(pct)}%</span></td>
                <td className="py-1.5 px-2 text-right"><span className={`font-mono text-[10px] font-bold ${hc}`}>{healthScore}</span></td>
                <td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right text-[10px]">{ago(sp.lastSeen)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {search&&nodes.length>0&&<div className="px-3 py-1.5 text-[10px] text-text3 bg-surface border-t border-border">{nodes.length} result{nodes.length>1?"s":""}</div>}
    </div>
  );
}

// ── Blobs ──
function BlobSection({topBlobs,recentBlobs}:{topBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],recentBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[]}) {
  return (
    <div className="space-y-6">
      <div><h2 className="text-xs font-bold mb-2 text-text3 uppercase tracking-wide">Recent ({recentBlobs.length})</h2><BlobTable blobs={recentBlobs} showTime/></div>
      <div><h2 className="text-xs font-bold mb-2 text-text3 uppercase tracking-wide">Largest ({topBlobs.length})</h2><BlobTable blobs={topBlobs}/></div>
      <div>
        <h2 className="text-xs font-bold mb-2 text-text3 uppercase tracking-wide">File Types</h2>
        <FileTypeBreakdown blobs={topBlobs}/>
      </div>
    </div>
  );
}

function BlobTable({blobs,showTime}:{blobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],showTime?:boolean}) {
  if(!blobs||blobs.length===0)return<div className="py-8 text-center text-text3 text-xs">none</div>;
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
          <th className="py-1.5 pl-3 pr-2 w-6">#</th><th className="py-1.5 px-2">name</th><th className="py-1.5 px-2 text-right">size</th><th className="py-1.5 px-2">status</th><th className="py-1.5 px-2 hidden sm:table-cell">owner</th><th className="py-1.5 px-2 text-right">chunks</th>{showTime&&<th className="py-1.5 pr-3 pl-2 text-right">age</th>}
        </tr></thead>
        <tbody>
          {blobs.map((b,i)=>{
            const d=b.isDeleted,w=b.isWritten!==false,e=b.expires&&parseInt(b.expires,10)<Date.now()*1000+86400_000_000;
            let badge="ok",bs="text-green-400";
            if(d){badge="del";bs="text-red-400"}else if(!w){badge="wip";bs="text-yellow-400"}else if(e){badge="exp";bs="text-yellow-400"};
            return(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="py-1.5 pl-3 pr-2 font-mono text-text3">{i+1}</td>
                <td className="py-1.5 px-2 text-text2 truncate max-w-[180px] sm:max-w-[300px]" title={b.name}>
                  <Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="hover:text-accent transition-colors">{shortName(b.name)}</Link>
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
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
      {sorted.map(([cat,s])=>(
        <div key={cat} className="border border-border p-2.5 text-center">
          <div className="font-bold text-xs">{cat}</div>
          <div className="font-mono text-[10px] text-accent mt-0.5">{fmtB(s.size)}</div>
          <div className="text-[9px] text-text3">{s.count}</div>
        </div>
      ))}
    </div>
  );
}

// ── Events ──
function EventsTable({events}:{events:{name:string;owner:string;type:string;time:string;hash?:string}[]}) {
  if(!events||events.length===0)return<div className="py-8 text-center text-text3 text-xs">none</div>;
  return (
    <div>
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3">
            <th className="py-1.5 pl-3 pr-2">type</th><th className="py-1.5 px-2">blob</th><th className="py-1.5 px-2 hidden sm:table-cell">tx</th><th className="py-1.5 pr-3 pl-2 text-right">time</th>
          </tr></thead>
          <tbody>
            {events.map((e,i)=>(
              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="py-1.5 pl-3 pr-2"><span className="font-mono text-[9px] text-text3">{e.type||"—"}</span></td>
                <td className="py-1.5 px-2 text-text2 truncate max-w-[200px] sm:max-w-[350px]" title={e.name}>{shortName(e.name)}</td>
                <td className="py-1.5 px-2 hidden sm:table-cell"><span className="font-mono text-[9px] text-text3" title={e.hash}>{e.hash?short(e.hash):"—"}</span></td>
                <td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right">{e.time?new Date(e.time).toLocaleString():"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Price ──
function PriceSection({totalSize,blobCount}:{totalSize:number;blobCount:number}) {
  const gb=totalSize>0?totalSize/(1024**3):0;
  const shelby=gb*0.01,aws=gb*0.073;
  const pct=aws>0?Math.round((1-shelby/aws)*100):70;
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 mb-4">
        <div className="border border-border p-4 text-center"><div className="text-xs text-text3 mb-1">AWS S3</div><div className="font-mono font-bold text-red-400">${aws.toFixed(0)}</div><div className="text-[9px] text-text3 mt-0.5">$0.023+$0.05/GB</div></div>
        <div className="border border-border p-4 text-center"><div className="text-xs text-text3 mb-1">Shelby</div><div className="font-mono font-bold text-green-400">${shelby.toFixed(0)}</div><div className="text-[9px] text-text3 mt-0.5">$0.01+$0.014/GB</div></div>
        <div className="border border-accent/30 bg-accent/5 p-4 text-center"><div className="text-xs text-text3 mb-1">Savings</div><div className="font-mono font-bold text-accent">~{pct}%</div><div className="text-[9px] text-text3 mt-0.5">{fmtB(totalSize)} data</div></div>
      </div>
      <a href="?_sp-calc" className="font-mono text-[10px] text-text3 hover:text-accent transition-colors">detailed calculator &rarr; shelbycn.com/tools/sp-calculator</a>
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
        <span className="font-medium text-text2">ShelbyNet</span> is the public testnet. Data Plane: DoubleZero fiber. Control Plane: Aptos. No persistence guarantees. <span className="text-text2">REST:</span> <code className="font-mono text-accent">GET /api/network-stats</code>
      </div>
    </div>
  );
}
