import type { Metadata } from "next";
import Link from "next/link";
import { getSPDetail } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  return { title: `SP ${address.slice(0, 10)}...` };
}

function fmtB(b: number): string {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0; let v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i > 0 ? 1 : 0)} ${u[i]}`;
}
function shorten(a: string): string { return `${a.slice(0, 8)}...${a.slice(-6)}`; }
function fmtTime(us: number): string { return us ? new Date(us / 1000).toLocaleString("zh-CN") : "—"; }
function shortName(n: string): string { const p = n.split("/"); return p[p.length - 1] || n.slice(0, 30); }

const STATUS_LABELS: Record<string, string> = { active: "活跃", joining: "接入中", vacated: "已退出" };

export default async function SPDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const sp = await getSPDetail(address);

  if (!sp) {
    return (
      <div className="max-w-[960px] mx-auto px-5 py-12 text-center">
        <Link href="/tools/sp-explorer" className="font-mono text-xs text-text3 hover:text-text">← 返回</Link>
        <div className="py-20">
          <h1 className="text-2xl font-extrabold mb-2">SP 未找到或查询失败</h1>
          <p className="text-text2 text-sm">请确认地址正确，或稍后重试。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-5 py-12">
      <Link href="/tools/sp-explorer" className="font-mono text-xs text-text3 hover:text-text transition-colors">← SP Explorer</Link>

      <div className="mt-4 mb-8">
        <div className="font-mono text-[11px] font-medium text-text3 uppercase tracking-wider mb-2">/ SP 详情</div>
        <h1 className="text-lg font-extrabold break-all mb-1">{address}</h1>
        <a href={`https://explorer.shelby.xyz/shelbynet/account/${address}`}
          target="_blank" rel="noopener noreferrer"
          className="font-mono text-xs text-accent hover:underline">Shelby Explorer ↗</a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatBox label="总槽位" value={sp.totalSlots.toString()} />
        <StatBox label="活跃" value={sp.activeSlots.toString()} color="text-green-400" />
        <StatBox label="接入中" value={sp.joiningSlots.toString()} color="text-yellow-400" />
        <StatBox label="已退出" value={sp.vacatedSlots.toString()} color="text-red-400" />
      </div>

      {/* Slot Details + Recent Activity */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <h2 className="text-lg font-extrabold mb-3">槽位列表 ({sp.totalSlots})</h2>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface text-left font-mono text-[10px] text-text3 uppercase tracking-wider">
                  <th className="py-2.5 pl-3 pr-2 font-medium">槽位</th>
                  <th className="py-2.5 px-2 font-medium">存储组</th>
                  <th className="py-2.5 px-2 font-medium">状态</th>
                  <th className="py-2.5 pr-3 pl-2 font-medium text-right">更新</th>
                </tr>
              </thead>
              <tbody>
                {sp.slots.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                    <td className="py-1.5 pl-3 pr-2 font-mono">{s.slot_index}</td>
                    <td className="py-1.5 px-2 font-mono text-text2 text-[10px]" title={s.placement_group}>{shorten(s.placement_group)}</td>
                    <td className="py-1.5 px-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                        s.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                        s.status === "joining" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                        "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                    </td>
                    <td className="py-1.5 pr-3 pl-2 font-mono text-text3 text-right text-[10px]">{fmtTime(s.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-extrabold mb-3">Blobs ({sp.blobs.length})</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            {sp.blobs.length === 0 && <div className="p-4 text-xs text-text3 text-center">暂无</div>}
            {sp.blobs.map((b, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-0 text-[11px]">
                <span className="font-mono text-text3 w-4 text-right shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-text2" title={b.name}>{shortName(b.name)}</span>
                <span className="font-mono text-accent font-semibold shrink-0">{fmtB(b.size)}</span>
                <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-sm border shrink-0 ${b.isDeleted?"bg-red-500/10 text-red-400 border-red-500/30":"bg-green-500/10 text-green-400 border-green-500/30"}`}>{b.isDeleted?"已删除":"活跃"}</span>
                <span className="font-mono text-text3 shrink-0 text-[10px]">{b.created ? new Date(parseInt(b.created, 10) / 1000).toLocaleDateString("zh-CN") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 text-center">
      <div className={`font-mono text-xl font-extrabold ${color ?? "text-text"}`}>{value}</div>
      <div className="text-[10px] text-text3 uppercase mt-0.5">{label}</div>
    </div>
  );
}
