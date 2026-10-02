import "server-only";

// Retain the original canonical until an independent preview origin is supplied.
const originalOrigin = "https://jolly-nail-printing-studio.walkersaint402.chatgpt.site";

export function siteIsIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true";
}

export function siteOrigin(): string {
  const value = process.env.SITE_URL?.trim();
  if (!value) {
    if (siteIsIndexable()) throw new Error("Set SITE_URL before enabling production indexing.");
    return originalOrigin;
  }
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be a public HTTP(S) origin without a path or credentials.");
  }
  if (siteIsIndexable() && (url.protocol !== "https:" || url.hostname.endsWith(".example") || url.hostname === "localhost")) {
    throw new Error("Production indexing requires the actual production HTTPS origin.");
  }
  return url.origin;
}
