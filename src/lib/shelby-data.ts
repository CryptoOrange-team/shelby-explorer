"use server";

const ENDPOINT = "https://api.shelbynet.aptoslabs.com/nocode/v1/public/alias/shelby/shelbynet/v1/graphql";

function gk() { return process.env.SHELBY_API_KEY ?? process.env.NEXT_PUBLIC_SHELBY_API_KEY ?? ""; }
function gh(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const k = gk(); if (k) h["Authorization"] = `Bearer ${k}`;
  return h;
}
async function gf(query: string, variables?: Record<string, unknown>) {
  if (!gk()) throw new Error("API key not configured");
  const res = await fetch(ENDPOINT, { method: "POST", headers: gh(), body: JSON.stringify({ query, variables }), cache: "no-store" });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL error");
  return json.data;
}

// ── Types ──
interface SlotRow { storage_provider: string; status: "active" | "joining" | "vacated"; slot_index: number; placement_group: string; updated_at: number; }
interface BlobRow { blob_name: string; size: string; owner: string; created_at: string; expires_at?: string; is_deleted?: boolean; is_written?: boolean; updated_at?: string; num_chunksets: string; }
interface EventRow { blob_name: string; owner: string; event_type: string; timestamp: string; transaction_hash?: string; }
interface PSRow { last_success_version: string; last_transaction_timestamp: string; last_updated: string; }

export interface SPNode { address: string; activeSlots: number; totalSlots: number; joiningSlots: number; vacatedSlots: number; lastSeen: number; }
export interface BlobItem { name: string; size: number; owner: string; chunksets: number; created: string; expires?: string; isDeleted?: boolean; isWritten?: boolean; }
export interface NetStatus { lastVersion: number; lastTxnTime: string; lastUpdated: string; }

export interface SPDetail extends SPNode {
  slots: { placement_group: string; slot_index: number; status: string; updated_at: number }[];
  blobs: BlobItem[];
}

export interface ShelbyNetworkData {
  nodes: SPNode[];
  totalSPs: number; activeSPs: number; totalSlots: number; activeSlots: number;
  blobCount: number; totalSize: number; activityCount: number;
  status: NetStatus | null;
  growth: { weekBlobs: number; weekSize: number; dayBlobs: number; daySize: number };
  events: { name: string; owner: string; type: string; time: string; hash?: string }[];
  recentBlobs: BlobItem[];
  topBlobs: BlobItem[];
  error: string | null;
}

function emptyData(error: string): ShelbyNetworkData {
  return { nodes: [], totalSPs: 0, activeSPs: 0, totalSlots: 0, activeSlots: 0, blobCount: 0, totalSize: 0, activityCount: 0, status: null, growth: { weekBlobs: 0, weekSize: 0, dayBlobs: 0, daySize: 0 }, events: [], recentBlobs: [], topBlobs: [], error };
}

// ── Main Query ──
export async function getShelbyData(sort: string = "active", search: string = ""): Promise<ShelbyNetworkData> {
  const filter = search ? `, where: { storage_provider: { _eq: "${search}" } }` : "";

  const query = `
    query Overview {
      placement_group_slots(order_by: { updated_at: desc }, limit: 2000${filter}) { storage_provider status slot_index placement_group updated_at }
      blobs_aggregate { aggregate { count sum { size } } }
      blob_activities_aggregate { aggregate { count } }
      blob_activities(order_by: { timestamp: desc }, limit: 25) { blob_name owner event_type timestamp transaction_hash }
      top_blobs: blobs(order_by: { size: desc }, limit: 50) { blob_name size owner created_at num_chunksets expires_at is_deleted is_written }
      recent_blobs: blobs(order_by: { created_at: desc }, limit: 30) { blob_name size owner created_at num_chunksets expires_at is_deleted is_written }
      processor_status(limit: 1, order_by: { last_updated: desc }) { last_success_version last_transaction_timestamp last_updated }
      week_aggregate: blobs_aggregate(where: {created_at: {_gte: "1781500000000000"}}) { aggregate { count sum { size } } }
      day_aggregate: blobs_aggregate(where: {created_at: {_gte: "1782000000000000"}}) { aggregate { count sum { size } } }
    }
  `;

  try {
    const data = await gf(query);
    const slots: SlotRow[] = data.placement_group_slots ?? [];
    const events: EventRow[] = data.blob_activities ?? [];
    const topBlobs: BlobRow[] = data.top_blobs ?? [];
    const recentBlobsRaw: BlobRow[] = data.recent_blobs ?? [];
    const ps: PSRow[] = data.processor_status ?? [];

    // Aggregate SPs
    const spMap = new Map<string, SPNode>();
    for (const s of slots) {
      const e = spMap.get(s.storage_provider);
      if (e) { e.totalSlots += 1; if (s.status === "active") e.activeSlots += 1; else if (s.status === "joining") e.joiningSlots += 1; else if (s.status === "vacated") e.vacatedSlots += 1; if (s.updated_at > e.lastSeen) e.lastSeen = s.updated_at; }
      else spMap.set(s.storage_provider, { address: s.storage_provider, totalSlots: 1, activeSlots: s.status === "active" ? 1 : 0, joiningSlots: s.status === "joining" ? 1 : 0, vacatedSlots: s.status === "vacated" ? 1 : 0, lastSeen: s.updated_at });
    }
    let nodes = Array.from(spMap.values());
    if (sort === "total") nodes.sort((a, b) => b.totalSlots - a.totalSlots);
    else nodes.sort((a, b) => b.activeSlots - a.activeSlots);

    return {
      nodes, totalSPs: nodes.length, activeSPs: nodes.filter(n => n.activeSlots > 0).length,
      totalSlots: slots.length, activeSlots: slots.filter(s => s.status === "active").length,
      blobCount: data.blobs_aggregate?.aggregate?.count ?? 0,
      totalSize: parseInt(data.blobs_aggregate?.aggregate?.sum?.size ?? "0", 10) || 0,
      activityCount: data.blob_activities_aggregate?.aggregate?.count ?? 0,
      status: ps.length > 0 ? { lastVersion: parseInt(ps[0].last_success_version, 10), lastTxnTime: ps[0].last_transaction_timestamp, lastUpdated: ps[0].last_updated } : null,
      growth: {
        weekBlobs: data.week_aggregate?.aggregate?.count ?? 0,
        weekSize: parseInt(data.week_aggregate?.aggregate?.sum?.size ?? "0", 10) || 0,
        dayBlobs: data.day_aggregate?.aggregate?.count ?? 0,
        daySize: parseInt(data.day_aggregate?.aggregate?.sum?.size ?? "0", 10) || 0,
      },
      events: events.map(e => ({ name: e.blob_name, owner: e.owner, type: e.event_type.split("::").pop()?.replace("Event", "") ?? "", time: e.timestamp, hash: e.transaction_hash })),
      recentBlobs: recentBlobsRaw.map(b => ({ name: b.blob_name, size: parseInt(b.size, 10) || 0, owner: b.owner, chunksets: parseInt(b.num_chunksets, 10) || 0, created: b.created_at, expires: b.expires_at, isDeleted: b.is_deleted, isWritten: b.is_written })),
      topBlobs: topBlobs.map(b => ({ name: b.blob_name, size: parseInt(b.size, 10) || 0, owner: b.owner, chunksets: parseInt(b.num_chunksets, 10) || 0, created: b.created_at, expires: b.expires_at, isDeleted: b.is_deleted, isWritten: b.is_written })),
      error: null,
    };
  } catch (e) { return emptyData(e instanceof Error ? e.message : "未知错误"); }
}

// ── SP Detail ──
export async function getSPDetail(address: string): Promise<SPDetail | null> {
  const query = `
    query SPDetail($addr: String!) {
      placement_group_slots(where: { storage_provider: { _eq: $addr } }, order_by: { updated_at: desc }, limit: 200) { placement_group slot_index status updated_at }
      blobs(where: { owner: { _eq: $addr } }, order_by: { size: desc }, limit: 30) { blob_name size created_at num_chunksets }
    }
  `;
  try {
    const data = await gf(query, { addr: address });
    const slots = data.placement_group_slots ?? [];
    const blobs = data.blobs ?? [];
    return {
      address, totalSlots: slots.length,
      activeSlots: slots.filter((s: SlotRow) => s.status === "active").length,
      joiningSlots: slots.filter((s: SlotRow) => s.status === "joining").length,
      vacatedSlots: slots.filter((s: SlotRow) => s.status === "vacated").length,
      lastSeen: slots.length > 0 ? Math.max(...slots.map((s: SlotRow) => s.updated_at)) : 0,
      slots: slots.map((s: SlotRow) => ({ placement_group: s.placement_group, slot_index: s.slot_index, status: s.status, updated_at: s.updated_at })),
      blobs: blobs.map((b: BlobRow) => ({ name: b.blob_name, size: parseInt(b.size, 10) || 0, owner: "", chunksets: parseInt(b.num_chunksets, 10) || 0, created: b.created_at, expires: b.expires_at, isDeleted: b.is_deleted })),
    };
  } catch { return null; }
}
