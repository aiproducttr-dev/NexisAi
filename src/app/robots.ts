import type { MetadataRoute } from "next";
import { getAppBaseUrl, getForumBaseUrl } from "@/lib/constants/urls";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppBaseUrl();
  const forumUrl = getForumBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/dashboard/new", "/api/"],
    },
    sitemap: [`${appUrl}/sitemap.xml`, `${forumUrl}/sitemap.xml`],
  };
}
