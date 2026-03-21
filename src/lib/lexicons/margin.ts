import type { Client } from "@atcute/client";
import { createRecord, fetchAllRecords, type Repo, type Nsid } from "../atproto";

// at.margin.bookmark — https://tangled.org/margin.at/margin/tree/main/lexicons/at/margin
export interface MarginBookmark {
  $type: "at.margin.bookmark";
  source: string;
  sourceHash?: string;
  title?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface MarginCollection {
  $type: "at.margin.collection";
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface MarginCollectionItem {
  $type: "at.margin.collectionItem";
  collection: string;
  annotation: string;
  createdAt: string;
  position?: number;
}

export interface MarginBookmarkOptions {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface MarginCollectionRef {
  uri: string;
  cid: string;
  name: string;
  description?: string;
}

export async function createMarginBookmark(
  rpc: Client,
  did: string,
  options: MarginBookmarkOptions,
): Promise<{ uri: string; cid: string }> {
  const record: MarginBookmark = {
    $type: "at.margin.bookmark",
    source: options.url,
    ...(options.title && { title: options.title }),
    ...(options.description && { description: options.description }),
    ...(options.tags && options.tags.length > 0 && { tags: options.tags }),
    createdAt: new Date().toISOString(),
  };

  return createRecord(rpc, did as Repo, "at.margin.bookmark", record);
}

export async function linkBookmarkToCollection(
  rpc: Client,
  did: string,
  bookmarkUri: string,
  collectionUri: string,
): Promise<string> {
  const record: MarginCollectionItem = {
    $type: "at.margin.collectionItem",
    collection: collectionUri,
    annotation: bookmarkUri,
    createdAt: new Date().toISOString(),
  };

  const { uri } = await createRecord(rpc, did as Repo, "at.margin.collectionItem", record);
  return uri;
}

export async function fetchMarginCollections(
  rpc: Client,
  did: string,
): Promise<MarginCollectionRef[]> {
  return fetchAllRecords(rpc, did as Repo, "at.margin.collection" as Nsid, (r) => {
    const v = r.value as MarginCollection;
    return { uri: r.uri, cid: r.cid, name: v.name ?? "(untitled)", description: v.description };
  });
}
