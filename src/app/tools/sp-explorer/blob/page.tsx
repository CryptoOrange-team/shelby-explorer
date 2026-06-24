import type { Metadata } from "next";
import Link from "next/link";
import { getBlobDetail } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blob Detail" };

function fmtB(b: number): string {
  if (!b) return "0"; const u=["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(i>0?1:0)}${u[i]}`;
}
function short(a:string):string{return`${a.slice(0,8)}...${a.slice(-6)}`}
function ago(us:number):string{if(!us)return"—";const s=Math.floor((Date.now()-us/1000)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`}

export default async function BlobDetailPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name } = await searchParams;
  if (!name) return <div className="max-w-[960px] mx-auto px-5 py-12 text-center text-text3 text-sm">No blob name provided.</div>;

  const b = await getBlobDetail(name);
  if (!b) return <div className="max-w-[960px] mx-auto px-5 py-12 text-center">
    <Link href="/" className="font-mono text-xs text-text3 hover:text-text">← back</Link>
    <div className="py-20"><h1 className="text-xl font-extrabold mb-2">Blob not found</h1><p className="text-text2 text-sm">May have been deleted or never existed.</p></div>
  </div>;

  const status = b.isDeleted ? "deleted" : !b.isWritten ? "writing" : b.expires && parseInt(b.expires,10) < Date.now()*1000 ? "expired" : "active";
  const sc = status==="active"?"text-green-400":status==="deleted"?"text-red-400":"text-yellow-400";

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-5 py-8 sm:py-12">
      <Link href="/" className="font-mono text-xs text-text3 hover:text-text transition-colors">← back</Link>
      <div className="mt-4">
        <h1 className="text-xl font-extrabold break-all mb-1">{b.name}</h1>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className={`font-mono font-bold ${sc}`}>{status}</span>
          <span className="text-text3">{fmtB(b.size)}</span>
          <span className="text-text3">{b.chunksets} chunks</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-8">
        <Field label="owner" value={b.owner} mono />
        <Field label="size" value={fmtB(b.size)} />
        <Field label="chunksets" value={b.chunksets.toString()} />
        <Field label="created" value={b.created ? new Date(parseInt(b.created,10)/1000).toLocaleString() : "—"} />
        <Field label="expires" value={b.expires ? new Date(parseInt(b.expires,10)/1000).toLocaleString() : "—"} />
        <Field label="written" value={b.isWritten ? "yes" : "no"} />
        <Field label="deleted" value={b.isDeleted ? "yes" : "no"} />
        {b.placementGroup && <Field label="placement group" value={b.placementGroup} mono />}
        {b.sliceAddress && <Field label="slice address" value={b.sliceAddress} mono />}
      </div>

      <div className="mt-6 flex gap-2">
        <a href={`https://explorer.shelby.xyz/shelbynet/account/${b.owner}`} target="_blank" rel="noopener noreferrer"
          className="font-mono text-[10px] text-text3 hover:text-text transition-colors">owner on shelby explorer →</a>
        <Link href={`/tools/sp-explorer/owner/${b.owner}`} className="font-mono text-[10px] text-text3 hover:text-text transition-colors">
          owner blobs →
        </Link>
      </div>
    </div>
  );
}

function Field({label,value,mono}:{label:string;value:string;mono?:boolean}) {
  return (
    <div className="border border-border p-3">
      <div className="text-[9px] text-text3 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-xs ${mono?"font-mono text-text2 break-all":"text-text"}`}>{value}</div>
    </div>
  );
}
