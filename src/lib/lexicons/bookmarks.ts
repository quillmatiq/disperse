import type { Client } from "@atcute/client";
import { createRecord, type Repo } from "../atproto";

// community.lexicon.bookmarks.bookmark — https://github.com/lexicon-community/lexicon
export interface BookmarkRecord {
  $type: "community.lexicon.bookmarks.bookmark";
  subject: string;
  createdAt: string;
  tags?: string[];
}

export async function createBookmark(
  rpc: Client,
  did: string,
  url: string,
  tags?: string[],
): Promise<{ uri: string; cid: string }> {
  const record: BookmarkRecord = {
    $type: "community.lexicon.bookmarks.bookmark",
    subject: url,
    createdAt: new Date().toISOString(),
    ...(tags && tags.length > 0 && { tags }),
  };

  return createRecord(rpc, did as Repo, "community.lexicon.bookmarks.bookmark", record);
}
