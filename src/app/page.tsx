import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ShelbyNet Explorer" };

function fmtB(b: number): string { if(!b)return"0";const u=["B","KB","MB","GB","TB","PB"];let i=0,v=b;while(v>=1024&&i<u.length-1){v/=1024;i++}return`${v.toFixed(i>0?1:0)} ${u[i]}`; }
function fmtN(n: number): string { if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`; if(n>=1_000)return`${(n/1_000).toFixed(1)}K`; return n.toLocaleString(); }
function short(a:string):string{return`${a.slice(0,5)}...${a.slice(-3)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,32)}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function ExplorerPage({ searchParams }: { searchParams: Promise<{sort?:string;search?:string;tab?:string}> }) {
  const sp = await searchParams;
  const sort=sp.sort??"active",search=sp.search??"",tab=sp.tab??"sp";
  const d = await getShelbyData(sort,search);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-4">
      {/* Header row */}
      <div style={{display:"flex",alignItems:"baseline",gap:24,marginBottom:16,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>
          {fmtN(d.blobCount)} blobs &middot; {fmtB(d.totalSize)} &middot; {fmtN(d.activityCount)} ops
          &nbsp;&middot;&nbsp; {d.activeSPs}/{d.totalSPs} SPs
          &nbsp;&middot;&nbsp; 24h +{fmtN(d.growth.dayBlobs)} &middot; 7d +{fmtN(d.growth.weekBlobs)}
        </span>
        <span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)",fontFamily:"var(--font-mono)"}}>auto-refresh 30s</span>
      </div>

      {d.error && <div style={{marginBottom:16,padding:"8px 12px",border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.06)",fontSize:12,color:"var(--red)",fontFamily:"var(--font-mono)"}}>{d.error}</div>}

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:12,borderBottom:"1px solid var(--border)"}}>
        {[{k:"sp",l:"Storage Providers"},{k:"blobs",l:"Blobs"},{k:"events",l:"Events"},{k:"price",l:"Cost"},{k:"dev",l:"Developers"}].map(t=>(
          <a key={t.k} href={`?tab=${t.k}&sort=${sort}`} style={{
            padding:"6px 14px",fontSize:12,fontWeight:500,borderBottom:tab===t.k?"2px solid var(--accent)":"2px solid transparent",
            color:tab===t.k?"var(--accent)":"var(--text2)",marginBottom:-1
          }}>{t.l}</a>
        ))}
        <a href="/tools/sp-explorer/map" style={{padding:"6px 14px",fontSize:12,fontWeight:500,borderBottom:"2px solid transparent",color:"var(--text2)",marginBottom:-1}}>Map</a>
        <a href="/api/network-stats" style={{padding:"6px 14px",fontSize:11,fontWeight:500,borderBottom:"2px solid transparent",color:"var(--text3)",marginBottom:-1,fontFamily:"var(--font-mono)",marginLeft:"auto"}}>JSON API</a>
      </div>

      {/* Toolbar */}
      {tab!=="dev"&&tab!=="price"&&(
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <form style={{display:"flex",gap:8,flex:1}}>
            <input name="search" defaultValue={search} placeholder={tab==="blobs"?"blob name…":"0x…"} style={{
              maxWidth:400,flex:1,padding:"5px 10px",fontSize:12,border:"1px solid var(--border)",
              background:"var(--bg)",color:"var(--text)",fontFamily:"var(--font-mono)",outline:"none"
            }} />
            <input type="hidden" name="tab" value={tab}/>
            <button type="submit" style={{padding:"5px 14px",fontSize:12,fontWeight:500,background:"var(--accent)",color:"#000",border:"none",cursor:"pointer"}}>Search</button>
            {search&&<a href={`?tab=${tab}&sort=${sort}`} style={{padding:"5px 10px",fontSize:12,border:"1px solid var(--border)",color:"var(--text2)"}}>clear</a>}
          </form>
          {tab==="sp"&&<>
            <a href="?tab=sp&sort=active" style={{padding:"5px 10px",fontSize:11,border:"1px solid "+(sort==="active"&&!search?"var(--accent)":"var(--border)"),color:sort==="active"&&!search?"var(--accent)":"var(--text2)",fontFamily:"var(--font-mono)"}}>active</a>
            <a href="?tab=sp&sort=total" style={{padding:"5px 10px",fontSize:11,border:"1px solid "+(sort==="total"&&!search?"var(--accent)":"var(--border)"),color:sort==="total"&&!search?"var(--accent)":"var(--text2)",fontFamily:"var(--font-mono)"}}>total</a>
          </>}
          <a href="/api/export-sp" style={{padding:"5px 10px",fontSize:11,border:"1px solid var(--border)",color:"var(--text2)",fontFamily:"var(--font-mono)"}}>CSV</a>
        </div>
      )}

      {tab==="sp"&&<SPTable nodes={d.nodes}/>}
      {tab==="blobs"&&<BlobSection topBlobs={d.topBlobs} recentBlobs={d.recentBlobs}/>}
      {tab==="events"&&<EventsTable events={d.events}/>}
      {tab==="price"&&<PriceSection totalSize={d.totalSize} growth={d.growth}/>}
      {tab==="dev"&&<DevSection/>}
    </div>
  );
}

function SPTable({nodes}:{nodes:{address:string;activeSlots:number;totalSlots:number;joiningSlots:number;vacatedSlots:number;lastSeen:number}[]}) {
  if(!nodes.length)return<div style={{padding:"60px 0",textAlign:"center",color:"var(--text3)",fontSize:13}}>No storage providers found.</div>;
  return (
    <div>
      <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
        <thead>
          <tr style={{color:"var(--text3)",fontFamily:"var(--font-mono)",fontSize:10,textTransform:"uppercase",letterSpacing:".05em"}}>
            <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500}}>address</th>
            <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:60}}>active</th>
            <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:50}}>join</th>
            <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:60}}>vacated</th>
            <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:60}}>health</th>
            <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:60}}>seen</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map(sp=>{
            const pct=sp.totalSlots>0?Math.round((sp.activeSlots/sp.totalSlots)*100):0;
            const hoursAgo=sp.lastSeen?(Date.now()-sp.lastSeen/1000)/3600000:999;
            const health=Math.round(pct*.6+Math.max(0,100-hoursAgo*10)*.4);
            const hc=health>=80?"var(--green)":health>=50?"var(--yellow)":"var(--red)";
            return (
              <tr key={sp.address} style={{borderTop:"1px solid var(--border)"}}>
                <td style={{padding:"6px 12px"}}>
                  <Link href={`/tools/sp-explorer/${sp.address}`} style={{color:"var(--accent)",fontFamily:"var(--font-mono)",fontSize:11}}>{short(sp.address)}</Link>
                </td>
                <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",color:sp.activeSlots?"var(--green)":"var(--text2)"}}>{sp.activeSlots||"—"}</td>
                <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",color:sp.joiningSlots?"var(--yellow)":"var(--text2)"}}>{sp.joiningSlots||"—"}</td>
                <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",color:sp.vacatedSlots?"var(--red)":"var(--text2)"}}>{sp.vacatedSlots||"—"}</td>
                <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",fontSize:11,fontWeight:600,color:hc}}>{health}</td>
                <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>{ago(sp.lastSeen)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--font-mono)",marginTop:6}}>{nodes.length} storage providers</div>
    </div>
  );
}

function BlobSection({topBlobs,recentBlobs}:{topBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],recentBlobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[]}) {
  return <div style={{display:"flex",flexDirection:"column",gap:32}}>
    <div><div style={{fontSize:12,fontWeight:500,marginBottom:8}}>Recent <span style={{color:"var(--text3)",fontWeight:400}}>({recentBlobs.length})</span></div><BlobTable blobs={recentBlobs} showTime/></div>
    <div><div style={{fontSize:12,fontWeight:500,marginBottom:8}}>Largest <span style={{color:"var(--text3)",fontWeight:400}}>({topBlobs.length})</span></div><BlobTable blobs={topBlobs}/></div>
  </div>;
}

function BlobTable({blobs,showTime}:{blobs:{name:string;size:number;owner:string;chunksets:number;created:string;expires?:string;isDeleted?:boolean;isWritten?:boolean}[],showTime?:boolean}) {
  if(!blobs?.length)return<div style={{padding:"40px 0",textAlign:"center",color:"var(--text3)"}}>none</div>;
  return (
    <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
      <thead><tr style={{color:"var(--text3)",fontFamily:"var(--font-mono)",fontSize:10,textTransform:"uppercase",letterSpacing:".05em"}}>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500,width:24}}>#</th>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500}}>name</th>
        <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:80}}>size</th>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500,width:50}}>st</th>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500}}>owner</th>
        {showTime&&<th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:50}}>age</th>}
      </tr></thead>
      <tbody>
        {blobs.map((b,i)=>{
          const d=b.isDeleted,w=b.isWritten===false,e=b.expires&&parseInt(b.expires,10)<Date.now()*1000+86400_000_000;
          const st=d?"del":w?"wip":e?"exp":"ok",sc=d?"var(--red)":w||e?"var(--yellow)":"var(--green)";
          return <tr key={i} style={{borderTop:"1px solid var(--border)"}}>
            <td style={{padding:"6px 12px",fontFamily:"var(--font-mono)",color:"var(--text3)",textAlign:"right"}}>{i+1}</td>
            <td style={{padding:"6px 12px",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={b.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(b.name)}`} style={{color:"var(--accent)"}}>{shortName(b.name)}</Link></td>
            <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",fontWeight:500,color:"var(--accent)"}}>{fmtB(b.size)}</td>
            <td style={{padding:"6px 12px",fontFamily:"var(--font-mono)",fontSize:10,color:sc}}>{st}</td>
            <td style={{padding:"6px 12px"}}><Link href={`/tools/sp-explorer/owner/${b.owner}`} style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text2)"}}>{short(b.owner)}</Link></td>
            {showTime&&<td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>{ago(parseInt(b.created,10)/1000)}</td>}
          </tr>;
        })}
      </tbody>
    </table>
  );
}

function EventsTable({events}:{events:{name:string;owner:string;type:string;time:string;hash?:string}[]}) {
  if(!events?.length)return<div style={{padding:"60px 0",textAlign:"center",color:"var(--text3)"}}>no events</div>;
  return (
    <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
      <thead><tr style={{color:"var(--text3)",fontFamily:"var(--font-mono)",fontSize:10,textTransform:"uppercase",letterSpacing:".05em"}}>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500,width:100}}>type</th>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500}}>blob</th>
        <th style={{padding:"8px 12px",textAlign:"left",fontWeight:500}}>owner</th>
        <th style={{padding:"8px 12px",textAlign:"right",fontWeight:500,width:160}}>time</th>
      </tr></thead>
      <tbody>
        {events.map((e,i)=><tr key={i} style={{borderTop:"1px solid var(--border)"}}>
          <td style={{padding:"6px 12px",fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>{e.type||"—"}</td>
          <td style={{padding:"6px 12px",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={e.name}><Link href={`/tools/sp-explorer/blob?name=${encodeURIComponent(e.name)}`} style={{color:"var(--accent)"}}>{shortName(e.name)}</Link></td>
          <td style={{padding:"6px 12px"}}><Link href={`/tools/sp-explorer/owner/${e.owner}`} style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text2)"}}>{short(e.owner)}</Link></td>
          <td style={{padding:"6px 12px",textAlign:"right",fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>{e.time?new Date(e.time).toLocaleString():"—"}</td>
        </tr>)}
      </tbody>
    </table>
  );
}

function PriceSection({totalSize,growth}:{totalSize:number;growth:{weekBlobs:number;weekSize:number;dayBlobs:number;daySize:number}}) {
  const gb=totalSize>0?totalSize/(1024**3):0;
  const s=gb*.01,a=gb*.073;
  const pct=a>0?Math.round((1-s/a)*100):70;
  return <div style={{maxWidth:600}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,marginBottom:16}}>
      <div style={{padding:"16px 20px",border:"1px solid var(--border)",textAlign:"center"}}><div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>AWS S3</div><div style={{fontSize:18,fontWeight:600,fontFamily:"var(--font-mono)",color:"var(--red)"}}>${a.toFixed(0)}</div><div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>$0.023+$0.05/GB</div></div>
      <div style={{padding:"16px 20px",border:"1px solid var(--border)",textAlign:"center"}}><div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>Shelby</div><div style={{fontSize:18,fontWeight:600,fontFamily:"var(--font-mono)",color:"var(--green)"}}>${s.toFixed(0)}</div><div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>$0.01+$0.014/GB</div></div>
      <div style={{padding:"16px 20px",border:"1px solid var(--accent)",textAlign:"center"}}><div style={{fontSize:11,color:"var(--text3)",marginBottom:4}}>Savings</div><div style={{fontSize:18,fontWeight:600,fontFamily:"var(--font-mono)",color:"var(--accent)"}}>~{pct}%</div><div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>{fmtB(totalSize)} total</div></div>
    </div>
    <div style={{padding:"10px 14px",border:"1px solid var(--border)",fontSize:11,color:"var(--text2)",fontFamily:"var(--font-mono)"}}>7d +{fmtN(growth.weekBlobs)} ({fmtB(growth.weekSize)}) · 24h +{fmtN(growth.dayBlobs)} ({fmtB(growth.daySize)})</div>
  </div>;
}

function DevSection() {
  return <div style={{maxWidth:600,display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
      {["docs.shelby.xyz","github.com/shelby","developers.shelby.xyz","discord.gg/shelbyserves"].map((n,i)=><a key={i} href={`https://${n}`} target="_blank" rel="noopener noreferrer" style={{padding:"12px 16px",border:"1px solid var(--border)",fontSize:12,fontWeight:500,color:"var(--text)"}}>{n}</a>)}
    </div>
    <div style={{padding:"16px",border:"1px solid var(--border)"}}>
      <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>REST API</div>
      <code style={{display:"block",padding:"8px 12px",fontSize:12,fontFamily:"var(--font-mono)",color:"var(--accent)",background:"var(--surface)"}}>GET /api/network-stats</code>
    </div>
    <div style={{padding:"14px 16px",border:"1px solid var(--border)",fontSize:11,color:"var(--text3)",lineHeight:1.6}}>
      ShelbyNet public testnet &middot; DoubleZero fiber &middot; Aptos settlement &middot; No persistence guarantees.
    </div>
  </div>;
}
