import "@atcute/atproto";
import type { AppBskyEmbedExternal, AppBskyFeedPost } from "@atcute/bluesky";
import type { Client } from "@atcute/client";
import { createRecord, type Repo, type Nsid } from "../atproto";

export interface UserProfile {
  handle: string;
  avatar?: string;
}

export async function fetchProfile(rpc: Client, did: string): Promise<UserProfile> {
  try {
    const res = await rpc.get("app.bsky.actor.getProfile", {
      params: { actor: did as `did:${string}:${string}` },
    });
    if (!res.ok) return { handle: did };
    const data = res.data as { handle: string; avatar?: string };
    return { handle: data.handle, avatar: data.avatar };
  } catch {
    return { handle: did };
  }
}

export interface LinkMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface BskyPostOptions {
  text: string;
  url?: string;
  linkMeta?: LinkMeta;
  thumb?: AppBskyEmbedExternal.External["thumb"];
}

const BSKY_MAX_BLOB_BYTES = 975_000; // 975KB

async function compressImage(buffer: ArrayBuffer, mimeType: string): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });

    const scale = Math.sqrt(BSKY_MAX_BLOB_BYTES / buffer.byteLength) * 0.85;
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(img.naturalWidth * scale);
    canvas.height = Math.floor(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

    const toBuffer = (q: number): Promise<ArrayBuffer> =>
      new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? blob.arrayBuffer().then(resolve) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          q,
        ),
      );

    for (let quality = 0.85; quality >= 0.3; quality -= 0.1) {
      const data = await toBuffer(quality);
      if (data.byteLength <= BSKY_MAX_BLOB_BYTES) return { data, mimeType: "image/jpeg" };
    }

    // Last resort: halve dimensions
    canvas.width = Math.floor(canvas.width / 2);
    canvas.height = Math.floor(canvas.height / 2);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: await toBuffer(0.7), mimeType: "image/jpeg" };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function uploadImageBlob(
  rpc: Client,
  imageUrl: string,
): Promise<AppBskyEmbedExternal.External["thumb"] | undefined> {
  try {
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const res = await fetch(imageUrl);
    if (!res.ok) return undefined;
    const mimeType = res.headers.get("content-type")?.split(";")[0].trim() ?? "image/jpeg";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) return undefined;
    let buffer = await res.arrayBuffer();
    let uploadMime = mimeType;

    if (buffer.byteLength > BSKY_MAX_BLOB_BYTES) {
      const compressed = await compressImage(buffer, mimeType);
      buffer = compressed.data;
      uploadMime = compressed.mimeType;
    }

    const uploadRes = await rpc.post("com.atproto.repo.uploadBlob", {
      input: buffer,
      headers: { "Content-Type": uploadMime },
    });
    if (!uploadRes.ok) return undefined;
    return uploadRes.data.blob as AppBskyEmbedExternal.External["thumb"];
  } catch {
    return undefined;
  }
}

export async function createBskyPost(
  rpc: Client,
  did: string,
  options: BskyPostOptions,
): Promise<string> {
  const embed = options.url
    ? {
        $type: "app.bsky.embed.external" as const,
        external: {
          uri: options.url as `${string}:${string}`,
          title: options.linkMeta?.title ?? "",
          description: options.linkMeta?.description ?? "",
          ...(options.thumb && { thumb: options.thumb }),
        },
      }
    : undefined;

  const record: AppBskyFeedPost.Main = {
    $type: "app.bsky.feed.post",
    text: options.text,
    ...(embed && { embed }),
    createdAt: new Date().toISOString(),
  };

  const { uri } = await createRecord(rpc, did as Repo, "app.bsky.feed.post" as Nsid, record);
  return uri;
}
