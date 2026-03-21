import type { APIRoute } from "astro";
import type { LinkMeta } from "../../lib/lexicons/bsky";
import { toMessage, isSafeUrl } from "../../lib/utils";

const META_MAX_LENGTH = 500;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMeta(html: string, property: string): string | undefined {
  // Handle both attribute orderings: property/name before or after content
  const p = escapeRegExp(property);
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"'<>]+)["']` +
    `|<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${p}["']`,
    "i",
  );
  const m = re.exec(html);
  const value = m ? (m[1] ?? m[2]) : undefined;
  return value ? value.slice(0, META_MAX_LENGTH) : undefined;
}

function parseOgTags(html: string): LinkMeta {
  return {
    title: getMeta(html, "og:title") ?? getMeta(html, "twitter:title"),
    description: getMeta(html, "og:description") ?? getMeta(html, "twitter:description"),
    image: getMeta(html, "og:image") ?? getMeta(html, "twitter:image"),
    siteName: getMeta(html, "og:site_name"),
  };
}

export const GET: APIRoute = async ({ url }) => {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url param" }), { status: 400 });
  }

  if (!isSafeUrl(targetUrl)) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Disperse/1.0; +https://disperse.social)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const data = parseOgTags(html);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: toMessage(err) }), { status: 500 });
  }
};
