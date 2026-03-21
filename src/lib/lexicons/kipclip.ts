import type { Client } from "@atcute/client";
import { putRecord, fetchAllRecords, atUriRkey, type Repo, type Nsid } from "../atproto";

// com.kipclip.annotation — https://tangled.org/tijs.org/kipclip-appview/blob/main/lexicons/com/kipclip/annotation.json
export interface KipclipAnnotation {
  $type: "com.kipclip.annotation";
  subject: string; // AT-URI of the community.lexicon.bookmarks.bookmark record
  note?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  createdAt: string;
}

// com.kipclip.tag — https://tangled.org/tijs.org/kipclip-appview/blob/main/lexicons/com/kipclip/tag.json
export interface KipclipTag {
  $type: "com.kipclip.tag";
  value: string;
  createdAt: string;
}

export interface KipclipTagRef {
  uri: string;
  cid: string;
  value: string;
}

interface KipclipPreferences {
  $type: "com.kipclip.preferences";
  dateFormat: string;
  readingListTag?: string;
  createdAt: string;
}

const READING_LIST_TAG_DEFAULT = "toread";

export async function fetchReadingListTag(
  rpc: Client,
  did: string,
): Promise<string> {
  const res = await rpc.get("com.atproto.repo.getRecord", {
    params: { repo: did as Repo, collection: "com.kipclip.preferences", rkey: "self" },
  });
  if (!res.ok) return READING_LIST_TAG_DEFAULT;
  const prefs = res.data.value as unknown as KipclipPreferences;
  return prefs.readingListTag ?? READING_LIST_TAG_DEFAULT;
}

export interface KipclipAnnotationOptions {
  bookmarkUri: string; // AT-URI of the community.lexicon.bookmarks.bookmark record
  title?: string;
  description?: string;
  image?: string;
  note?: string;
}


export async function fetchKipclipTags(
  rpc: Client,
  did: string,
): Promise<KipclipTagRef[]> {
  return fetchAllRecords(rpc, did as Repo, "com.kipclip.tag" as Nsid, (r) => {
    const v = r.value as KipclipTag;
    return { uri: r.uri, cid: r.cid, value: v.value };
  });
}

export async function createKipclipAnnotation(
  rpc: Client,
  did: string,
  options: KipclipAnnotationOptions,
): Promise<{ uri: string; cid: string }> {
  const record: KipclipAnnotation = {
    $type: "com.kipclip.annotation",
    subject: options.bookmarkUri,
    ...(options.title && { title: options.title }),
    ...(options.description && { description: options.description }),
    ...(options.image && { image: options.image }),
    ...(options.note && { note: options.note }),
    createdAt: new Date().toISOString(),
  };

  return putRecord(rpc, did as Repo, "com.kipclip.annotation", atUriRkey(options.bookmarkUri), record);
}
