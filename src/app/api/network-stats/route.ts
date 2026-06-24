import { NextResponse } from "next/server";
import { getShelbyData } from "@/lib/shelby-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await getShelbyData();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    network: "shelbynet",
    stats: {
      totalSPs: d.totalSPs,
      activeSPs: d.activeSPs,
      totalSlots: d.totalSlots,
      activeSlots: d.activeSlots,
      blobCount: d.blobCount,
      totalSize: d.totalSize,
      activityCount: d.activityCount,
      growth: d.growth,
    },
    spNodes: d.nodes.map(sp => ({
      address: sp.address,
      activeSlots: sp.activeSlots,
      totalSlots: sp.totalSlots,
      joiningSlots: sp.joiningSlots,
      vacatedSlots: sp.vacatedSlots,
      healthScore: sp.totalSlots > 0 ? Math.round((sp.activeSlots / sp.totalSlots) * 60 + (sp.lastSeen ? Math.max(0, 100 - ((Date.now() - sp.lastSeen / 1000) / 3600000) * 10) : 0) * 40) : 0,
    })),
    error: d.error,
  }, { status: d.error ? 500 : 200 });
}
