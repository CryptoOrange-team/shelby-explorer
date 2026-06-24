import type { Metadata } from "next";
import Link from "next/link";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";

function fmtB(b: number): string {
  if (!b) return "0 B";
  const u = ["B","KB","MB","GB","TB","PB"]; let i=0,v=b;
  while(v>=1024&&i<u.length-1){v/=1024;i++}
  return `${v.toFixed(i>0?1:0)} ${u[i]}`;
}
function short(a:string):string{return`${a.slice(0,8)}...${a.slice(-6)}`}
function shortName(n:string):string{const p=n.split("/");return p[p.length-1]||n.slice(0,30)}

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  return { title: `Owner ${address.slice(0,10)}...` };
}

async function getOwnerBlobs(address: string) {
  const ENDPOINT = "https://api.shelbynet.aptoslabs.com/nocode/v1/public/alias/shelby/shelbynet/v1/graphql";
  const key = process.env.SHELBY_API_KEY ?? "";
  if (!key) return { blobs: [], totalSize: 0, error: "API key 未配置" };

  try {
    const query = `query OwnerBlobs($addr:String!){
      blobs(where:{owner:{_eq:$addr}},order_by:{size:desc},limit:100){blob_name size created_at num_chunksets expires_at is_deleted}
      blobs_aggregate(where:{owner:{_eq:$addr}}){aggregate{count sum{size}}}
    }`;
    const res = await fetch(ENDPOINT, { method:"POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
      body: JSON.stringify({ query, variables: { addr: address } }), cache:"no-store" });
    const json = await res.json();
    if (json.errors) return { blobs:[], totalSize:0, error: json.errors[0]?.message };
    return {
      blobs: (json.data?.blobs??[]).map((b:{blob_name:string;size:string;created_at:string;num_chunksets:string;expires_at?:string;is_deleted?:boolean}) => ({
        name: b.blob_name, size: parseInt(b.size,10)||0, created: b.created_at, chunksets: parseInt(b.num_chunksets,10)||0, expires: b.expires_at, deleted: b.is_deleted,
      })),
      totalSize: parseInt(json.data?.blobs_aggregate?.aggregate?.sum?.size??"0",10)||0,
      totalCount: json.data?.blobs_aggregate?.aggregate?.count??0,
      error: null,
    };
  } catch(e) { return { blobs:[], totalSize:0, error: (e as Error).message }; }
}

export default async function OwnerPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const data = await getOwnerBlobs(address);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-5 py-8 sm:py-12">
      <Link href="/tools/sp-explorer" className="font-mono text-xs text-text3 hover:text-text transition-colors">← 浏览器</Link>

      <div className="mt-4 mb-8">
        <div className="font-mono text-[10px] font-medium text-text3 uppercase tracking-wider mb-2">/ 所有者</div>
        <h1 className="text-lg font-extrabold break-all mb-1">{address}</h1>
        {data.error && <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 rounded-lg text-sm text-red-400">{data.error}</div>}
        {!data.error && (
          <div className="flex gap-4 mt-3 text-xs text-text3">
            <span>总 Blobs: <strong className="text-text">{data.totalCount?.toLocaleString()}</strong></span>
            <span>总大小: <strong className="text-accent">{fmtB(data.totalSize)}</strong></span>
          </div>
        )}
      </div>

      {data.blobs.length > 0 && (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3 uppercase tracking-wider">
              <th className="py-2.5 pl-4 pr-2 w-8">#</th>
              <th className="py-2.5 px-2">文件名</th>
              <th className="py-2.5 px-2 text-right">大小</th>
              <th className="py-2.5 px-2">状态</th>
              <th className="py-2.5 pr-4 pl-2 text-right">分片</th>
            </tr></thead>
            <tbody>
              {data.blobs.map((b: {name:string;size:number;created:string;chunksets:number;expires?:string;deleted?:boolean}, i: number)=>(
                <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="py-2 pl-4 pr-2 font-mono text-text3">{i+1}</td>
                  <td className="py-2 px-2 text-text2 truncate max-w-[300px]" title={b.name}>{shortName(b.name)}</td>
                  <td className="py-2 px-2 font-mono text-accent font-semibold text-right">{fmtB(b.size)}</td>
                  <td className="py-2 px-2">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border ${b.deleted?"bg-red-500/10 text-red-400 border-red-500/30":"bg-green-500/10 text-green-400 border-green-500/30"}`}>{b.deleted?"已删除":"活跃"}</span>
                  </td>
                  <td className="py-2 pr-4 pl-2 font-mono text-text3 text-right">{b.chunksets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
