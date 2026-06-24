import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,6)}...${a.slice(-4)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,36)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

const TABS = [{k:"sp",l:"Storage Providers"},{k:"blobs",l:"Blobs"},{k:"events",l:"Events"},{k:"price",l:"Cost"},{k:"dev",l:"Developers"}];

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{sort?:string;search?:string;tab?:string}> }) {
  const sp = await searchParams;
  const sort=sp.sort??"active",search=sp.search??"",tab=sp.tab??"sp";
  const d = await getShelbyData(sort,search);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Total Blobs" value={fmtN(d.blobCount)} />
        <MetricCard label="Storage" value={fmtB(d.totalSize)} />
        <MetricCard label="Operations" value={fmtN(d.activityCount)} />
        <MetricCard label="SPs" value={`${d.activeSPs}/${d.totalSPs}`} sub="active / total" />
        <MetricCard label="24h Growth" value={`+${fmtN(d.growth.dayBlobs)}`} sub={`${fmtB(d.growth.daySize)}`} />
        <MetricCard label="7d Growth" value={`+${fmtN(d.growth.weekBlobs)}`} sub={`${fmtB(d.growth.weekSize)}`} />
      </div>

      {d.error && <div className="mb-5 p-3 border border-[var(--red-bg)] bg-[var(--red-bg)] text-[13px] text-[var(--red)]" style={{fontFamily:"var(--font-mono)"}}>{d.error}</div>}

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-[var(--border)]">
        {TABS.map(t=>(
          <a key={t.k} href={`?tab=${t.k}&sort=${sort}`}
            className={`px-4 py-2 text-[13px] font-medium border-b-[3px] -mb-[1px] transition-colors ${tab===t.k?"border-[var(--accent)] text-[var(--accent)]":"border-transparent text-[var(--text2)] hover:text-[var(--text)]"}`}>
            {t.l}
          </a>
        ))}
        <a href="/tools/sp-explorer/map" className="px-4 py-2 text-[13px] font-medium border-b-[3px] border-transparent text-[var(--text2)] hover:text-[var(--text)] -mb-[1px]">Map</a>
        <a href="/api/network-stats" className="px-4 py-2 text-[13px] border-b-[3px] border-transparent text-[var(--text3)] hover:text-[var(--text2)] -mb-[1px]" style={{fontFamily:"var(--font-mono)"}}>JSON</a>
      </div>

      {/* Toolbar */}
      {tab!=="dev"&&tab!=="price"&&(
        <div className="flex gap-2 mb-4">
          <form className="flex-1 flex gap-2">
            <input name="search" defaultValue={search} placeholder={tab==="blobs"?"blob name…":"0x…"}
              className="max-w-md px-3 py-2 text-[13px] border border-[var(--border)] bg-white text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(26,115,232,.2)] outline-none"
              style={{fontFamily:"var(--font-mono)"}} />
            <input type="hidden" name="tab" value={tab}/>
            <button type="submit" className="px-4 py-2 text-[13px] font-medium bg-[var(--accent)] text-white hover:bg-[#1557b0] transition-colors">Search</button>
            {search&&<a href={`?tab=${tab}&sort=${sort}`} className="px-3 py-2 text-[13px] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">Clear</a>}
          </form>
          {tab==="sp"&&<>
            <SortBtn active={sort==="active"&&!search} href="?tab=sp&sort=active">Active</SortBtn>
            <SortBtn active={sort==="total"&&!search} href="?tab=sp&sort=total">Total</SortBtn>
          </>}
          <a href="/api/export-sp" className="flex items-center px-3 py-2 text-[12px] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] transition-colors" style={{fontFamily:"var(--font-mono)"}}>CSV</a>
        </div>
      )}

      {tab==="sp"&&<SPTable nodes={d.nodes}/>}
      {tab==="blobs"&&<BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs}/>}
      {tab==="events"&&<EventsTable events={d.events}/>}
      {tab==="price"&&<PriceSection totalSize={d.totalSize} growth={d.growth}/>}
      {tab==="dev"&&<DevSection/>}

      <p className="mt-12 text-[11px] text-[var(--text3)] text-right" style={{fontFamily:"var(--font-mono)"}}>ShelbyNet GraphQL · {new Date().toISOString()}</p>
    </div>
  );
}

function MetricCard({label,value,sub}:{label:string;value:string;sub?:string}) {
  return (
    <div className="p-4 bg-white border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="text-[11px] text-[var(--text2)] mb-1">{label}</div>
      <div className="text-xl font-semibold tabular-nums" style={{fontFamily:"var(--font-mono)"}}>{value}</div>
      {sub&&<div className="text-[11px] text-[var(--text3)] mt-0.5">{sub}</div>}
    </div>
  );
}

function SortBtn({active,href,children}:{active:boolean;href:string;children:React.ReactNode}) {
  return <a href={href} className={`px-3 py-2 text-[12px] border transition-colors ${active?"border-[var(--accent)] text-[var(--accent)] bg-[#e8f0fe]":"border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)]"}`} style={{fontFamily:"var(--font-mono)"}}>{children}</a>;
}

// ── SP Table ──
function SPTable({nodes}:{nodes:{address:string;activeSlots:number;totalSlots:number;joiningSlots:number;vacatedSlots:number;lastSeen:number}[]}) {
  if(!nodes.length)return<div className="py-20 text-center text-[var(--text3)] text-[13px]">No storage providers found.</div>;
  return (
    <div>
      <div className="overflow-x-auto border border-[var(--border)]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--surface)] text-left text-[var(--text2)] text-[12px] font-medium border-b border-[var(--border)]">
              <th className="py-3 pl-4 pr-3 w-[160px]">Address</th>
              <th className="py-3 px-3 text-right w-[72px]">Active</th>
              <th className="py-3 px-3 text-right w-[60px]">Join</th>
              <th className="py-3 px-3 text-right w-[72px]">Vacated</th>
              <th className="py-3 px-3 hidden md:table-cell">Active Rate</th>
              <th className="py-3 px-3 text-right w-[68px]">Health</th>
              <th className="py-3 pr-4 pl-3 text-right w-[72px]">Seen</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(sp=>{
              const pct=sp.totalSlots>0?Math.round((sp.activeSlots/sp.totalSlots)*100):0;
              const hoursAgo=sp.lastSeen?(Date.now()-sp.lastSeen/1000)/3600000:999;
              const health=Math.round(pct*.6+Math.max(0,100-hoursAgo*10)*.4);
              const hc=health>=80?`var(--green)`:health>=50?`var(--yellow)`:`var(--red)`;
              const recent=sp.lastSeen&&(Date.now()-sp.lastSeen/1000)<600_000;
              return (
                <tr key={sp.address} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 pl-4 pr-3">
                    <div className="flex items-center gap-2">
                      {recent&&<span className="w-2 h-2 rounded-full bg-[var(--green)] shrink-0" title="Active <10 min"/>}
                      <Link href={`/tools/sp-explorer/${sp.address}`} className="text-[var(--accent)] hover:underline" style={{fontFamily:"var(--font-mono)",fontSize:"12px"}} title={sp.address}>{short(sp.address)}</Link>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums" style={{fontFamily:"var(--font-mono)",color:sp.activeSlots?`var(--green)`:`var(--text2)`}}>{sp.activeSlots||"—"}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums" style={{fontFamily:"var(--font-mono)",color:sp.joiningSlots?`var(--yellow)`:`var(--text2)`}}>{sp.joiningSlots||"—"}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums" style={{fontFamily:"var(--font-mono)",color:sp.vacatedSlots?`var(--red)`:`var(--text2)`}}>{sp.vacatedSlots||"—"}</td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    <div className="flex items-center gap-2 max-w-[160px]">
                      <div className="flex-1 h-1.5 bg-[var(--border)]"><div className="h-full bg-[var(--accent)]" style={{width:`${pct}%`}}/></div>
                      <span className="text-[11px] text-[var(--text2)] tabular-nums w-8 text-right" style={{fontFamily:"var(--font-mono)"}}>{pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right"><span className="font-semibold tabular-nums" style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:hc}}>{health}</span></td>
                  <td className="py-2.5 pr-4 pl-3 text-right text-[var(--text3)] tabular-nums" style={{fontFamily:"var(--font-mono)",fontSize:"11px"}}>{ago(sp.lastSeen)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-[var(--text3)]" style={{fontFamily:"var(--font-mono)"}}>{nodes.length} storage provider{nodes.length>1?"s":""}</p>
    </div>
  );
}

// ── Blobs ──
function BlobSection({topBlobs,recentBlobs}:{topBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],recentBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[]}) {
  return <div className="space-y-8">
    <div><h2 className="text-[13px] font-medium text-[var(--text)] mb-3">Recent Uploads <span className="text-[var(--text3)] font-normal">({recentBlobs.length})</span></h2><BlobTable blobs={recentBlobs} showTime/></div>
    <div><h2 className="text-[13px] font-medium text-[var(--text)] mb-3">Largest Blobs <span className="text-[var(--text3)] font-normal">({topBlobs.length})</span></h2><BlobTable blobs={topBlobs}/></div>
  </div>;
}

function BlobTable({blobs,showTime}:{blobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],showTime?:boolean}) {
  if(!blobs?.length)return<div className="py-16 text-center text-[var(--text3)] text-[13px] border border-[var(--border)]">No blobs found.</div>;
  return (
    <div className="overflow-x-auto border border-[var(--border)]">
      <table className="w-full text-[13px]">
        <thead><tr className="bg-[var(--surface)] text-left text-[var(--text2)] text-[12px] font-medium border-b border-[var(--border)]">
          <th className="py-3 pl-4 pr-3 w-8">#</th><th className="py-3 px-3">Name</th><th className="py-3 px-3 text-right w-[100px]">Size</th><th className="py-3 px-3 w-[72px]">Status</th><th className="py-3 px-3 hidden lg:table-cell">Owner</th><th className="py-3 px-3 text-right w-[72px]">Chunks</th>{showTime&&<th className="py-3 pr-4 pl-3 text-right w-[72px]">Age</th>}
        </tr></thead>
        <tbody>
          {blobs.map((b,i)=>{
            const d=b.isDeleted,w=b.isWritten===false,e=b.expires&&parseInt(b.expires,10)<Date.now()*1000+86400_000_000;
            const status=d?"del":w?"wip":e?"exp":"ok";
            const sc=d?`var(--red)`:w||e?`var(--yellow)`:`var(--green)`;
            return <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
              <td className="py-2.5 pl-4 pr-3 text-[var(--text3)] tabular-nums" style={{fontFamily:"var(--font-mono)"}}>{i+1}</td>
              <td className="py-2.5 px-3 max-w-[300px] truncate" title={b.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} className="text-[var(--accent)] hover:underline">{shortName(b.name)}</Link></td>
              <td className="py-2.5 px-3 text-right tabular-nums" style={{fontFamily:"var(--font-mono)",color:`var(--accent)`}}>{fmtB(b.size)}</td>
              <td className="py-2.5 px-3"><span className="text-[12px] font-medium" style={{fontFamily:"var(--font-mono)",color:sc}}>{status}</span></td>
              <td className="py-2.5 px-3 hidden lg:table-cell"><Link href={`/tools/sp-explorer/owner/${b.owner}`} className="text-[var(--accent)] hover:underline" style={{fontFamily:"var(--font-mono)",fontSize:"12px"}}>{short(b.owner)}</Link></td>
              <td className="py-2.5 px-3 text-right text-[var(--text2)] tabular-nums" style={{fontFamily:"var(--font-mono)"}}>{b.chunksets}</td>
              {showTime&&<td className="py-2.5 pr-4 pl-3 text-right text-[var(--text3)] tabular-nums" style={{fontFamily:"var(--font-mono)",fontSize:"11px"}}>{ago(parseInt(b.created,10)/1000)}</td>}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Events ──
function EventsTable({events}:{events:{name:string;owner:string;type:string;time:string;hash?:string}[]}) {
  if(!events?.length)return<div className="py-20 text-center text-[var(--text3)] text-[13px] border border-[var(--border)]">No recent events.</div>;
  return (
    <div className="overflow-x-auto border border-[var(--border)]">
      <table className="w-full text-[13px]">
        <thead><tr className="bg-[var(--surface)] text-left text-[var(--text2)] text-[12px] font-medium border-b border-[var(--border)]">
          <th className="py-3 pl-4 pr-3 w-[120px]">Type</th><th className="py-3 px-3">Blob</th><th className="py-3 px-3 hidden lg:table-cell">Owner</th><th className="py-3 pr-4 pl-3 text-right w-[180px]">Time</th>
        </tr></thead>
        <tbody>
          {events.map((e,i)=><tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
            <td className="py-2.5 pl-4 pr-3 text-[var(--text3)]" style={{fontFamily:"var(--font-mono)",fontSize:"11px"}}>{e.type||"—"}</td>
            <td className="py-2.5 px-3 max-w-[350px] truncate" title={e.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} className="text-[var(--accent)] hover:underline">{shortName(e.name)}</Link></td>
            <td className="py-2.5 px-3 hidden lg:table-cell"><Link href={`/tools/sp-explorer/owner/${e.owner}`} className="text-[var(--accent)] hover:underline" style={{fontFamily:"var(--font-mono)",fontSize:"12px"}}>{short(e.owner)}</Link></td>
            <td className="py-2.5 pr-4 pl-3 text-right text-[var(--text3)] tabular-nums" style={{fontFamily:"var(--font-mono)",fontSize:"11px"}}>{e.time?new Date(e.time).toLocaleString():"—"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

// ── Price ──
function PriceSection({totalSize,growth}:{totalSize:number;growth:{weekBlobs:number;weekSize:number;dayBlobs:number;daySize:number}}) {
  const gb=totalSize>0?totalSize/(1024**3):0;
  const shelby=gb*.01,aws=gb*.073;
  const savings=aws>0?Math.round((1-shelby/aws)*100):70;
  return <div className="max-w-2xl">
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="p-5 border border-[var(--border)] bg-white text-center"><div className="text-[12px] text-[var(--text2)] mb-1">AWS S3</div><div className="text-xl font-semibold text-[var(--red)]" style={{fontFamily:"var(--font-mono)"}}>${aws.toFixed(0)}</div><div className="text-[11px] text-[var(--text3)] mt-1">$0.023 + $0.05/GB</div></div>
      <div className="p-5 border border-[var(--border)] bg-white text-center"><div className="text-[12px] text-[var(--text2)] mb-1">Shelby</div><div className="text-xl font-semibold text-[var(--green)]" style={{fontFamily:"var(--font-mono)"}}>${shelby.toFixed(0)}</div><div className="text-[11px] text-[var(--text3)] mt-1">$0.01 + $0.014/GB</div></div>
      <div className="p-5 border border-[var(--accent)] bg-[#e8f0fe] text-center"><div className="text-[12px] text-[var(--text2)] mb-1">Savings</div><div className="text-xl font-semibold text-[var(--accent)]" style={{fontFamily:"var(--font-mono)"}}>~{savings}%</div><div className="text-[11px] text-[var(--text3)] mt-1">{fmtB(totalSize)} total</div></div>
    </div>
    <div className="p-4 border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text2)]">
      7d: +{fmtN(growth.weekBlobs)} blobs ({fmtB(growth.weekSize)}) · 24h: +{fmtN(growth.dayBlobs)} blobs ({fmtB(growth.daySize)})
    </div>
  </div>;
}

// ── Dev ──
function DevSection() {
  return <div className="max-w-2xl space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {[{n:"docs.shelby.xyz",h:"https://docs.shelby.xyz"},{n:"github.com/shelby",h:"https://github.com/shelby/examples"},{n:"developers.shelby.xyz",h:"https://developers.shelby.xyz"},{n:"discord.gg/shelbyserves",h:"https://discord.gg/shelbyserves"}].map(l=><a key={l.h} href={l.h} target="_blank" rel="noopener noreferrer" className="p-4 border border-[var(--border)] bg-white hover:bg-[var(--surface)] transition-colors text-[13px] text-[var(--text)]"><span className="font-medium">{l.n}</span></a>)}
    </div>
    <div className="p-5 border border-[var(--border)] bg-white">
      <div className="text-[12px] text-[var(--text2)] mb-1">REST API</div>
      <code className="block text-[13px] text-[var(--accent)] bg-[var(--surface)] px-3 py-2" style={{fontFamily:"var(--font-mono)"}}>GET /api/network-stats</code>
      <a href="/api/network-stats" target="_blank" className="inline-block mt-2 text-[12px] text-[var(--accent)] hover:underline">Open →</a>
    </div>
  </div>;
}
