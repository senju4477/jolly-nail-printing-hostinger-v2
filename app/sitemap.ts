import type { MetadataRoute } from "next";
import { siteIsIndexable, siteOrigin } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteIsIndexable() ? [{ url: `${siteOrigin()}/` }] : [];
}
