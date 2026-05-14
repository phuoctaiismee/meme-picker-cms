import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "@/lib/cache";

export async function GET() {
  const cacheKey = "dashboard:stats";
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log("[Dashboard API] Cache hit");
      return NextResponse.json(cached);
    }

    const supabase = await createSupabaseServerClient();

    const [
      { count: totalMemes },
      { count: activeMemes },
      { count: totalTags },
      { count: totalInteractions },
      { data: trendingTagsData },
      { data: trendingMemesData },
      { data: interactionHistoryData },
    ] = await Promise.all([
      supabase.from("memes").select("*", { count: "exact", head: true }),
      supabase.from("memes").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("tags").select("*", { count: "exact", head: true }),
      supabase.from("admin_audit_logs").select("*", { count: "exact", head: true }).like("action", "meme.%"),
      
      // Trending Tags
      supabase
        .from("tags")
        .select(`
          id, name, slug, category,
          meme_tags:meme_tags(count)
        `)
        .order("meme_tags(count)", { ascending: false })
        .limit(5),

      // Trending Memes
      supabase
        .from("admin_audit_logs")
        .select("entity_id")
        .eq("entity_type", "meme")
        .like("action", "meme.%")
        .limit(100),

      // Interaction History (Last 7 days)
      supabase
        .from("admin_audit_logs")
        .select("created_at")
        .like("action", "meme.%")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Process Trending Memes
    const memeIds = [...new Set((trendingMemesData ?? []).map((log: any) => log.entity_id))];
    const { data: memesData } = await supabase
      .from("memes")
      .select("id, media_key, title, media_url, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))")
      .in("id", memeIds.slice(0, 5));

    const interactionCounts = new Map();
    (trendingMemesData ?? []).forEach((log: any) => {
      interactionCounts.set(log.entity_id, (interactionCounts.get(log.entity_id) ?? 0) + 1);
    });

    const trendingMemes = (memesData ?? [])
      .map((m: any) => ({
        ...m,
        interaction_count: interactionCounts.get(m.id) ?? 0,
        tags: m.meme_tags?.map((j: any) => j.tags).filter(Boolean) ?? []
      }))
      .sort((a, b) => b.interaction_count - a.interaction_count);

    // Process Interaction History
    const historyMap = new Map();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    last7Days.forEach(date => historyMap.set(date, 0));
    (interactionHistoryData ?? []).forEach((log: any) => {
      const date = log.created_at.split("T")[0];
      if (historyMap.has(date)) {
        historyMap.set(date, historyMap.get(date) + 1);
      }
    });

    const result = {
      totalMemes: totalMemes ?? 0,
      activeMemes: activeMemes ?? 0,
      totalTags: totalTags ?? 0,
      totalInteractions: totalInteractions ?? 0,
      trendingMemes,
      trendingTags: (trendingTagsData ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        category: t.category,
        usage_count: t.meme_tags?.[0]?.count ?? 0
      })),
      interactionHistory: Array.from(historyMap.entries()).map(([date, count]) => ({ date, count }))
    };

    await cache.set(cacheKey, result, 120);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
