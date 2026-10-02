import type { MetadataRoute } from "next";
import { siteIsIndexable, siteOrigin } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return siteIsIndexable()
    ? { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${siteOrigin()}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
