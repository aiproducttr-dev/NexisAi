import { fetchLiveCampaignStats } from "@/lib/stats/fetch-live-campaign-stats";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await fetchLiveCampaignStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Live campaign stats error:", error);
    return NextResponse.json(
      { error: "İstatistikler alınamadı" },
      { status: 500 },
    );
  }
}
