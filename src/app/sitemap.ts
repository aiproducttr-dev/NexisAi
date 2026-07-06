import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { APP_URL, FORUM_URL } from "@/lib/constants/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;
  const forumUrl = FORUM_URL;

  const supabase = await createClient();

  const { data: contents } = await supabase
    .from("published_contents")
    .select("slug, created_at")
    .order("created_at", { ascending: false });

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("slug, updated_at, last_reply_at")
    .order("last_reply_at", { ascending: false });

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: forumUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  for (const item of contents ?? []) {
    routes.push({
      url: `${baseUrl}/content/${item.slug}`,
      lastModified: new Date(item.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const item of topics ?? []) {
    routes.push({
      url: `${forumUrl}/t/${item.slug}`,
      lastModified: new Date(item.last_reply_at || item.updated_at),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return routes;
}
