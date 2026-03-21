import type { APIRoute } from "astro";
import { isSafeUrl } from "../../lib/utils";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const GET: APIRoute = async ({ url }) => {
  const imageUrl = url.searchParams.get("url");
  if (!imageUrl) {
    return new Response("Missing url param", { status: 400 });
  }
  if (!isSafeUrl(imageUrl)) {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    const mimeType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return new Response("Unsupported image type", { status: 415 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return new Response("Image too large", { status: 413 });
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Failed to fetch image", { status: 502 });
  }
};
