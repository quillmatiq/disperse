import "@atcute/atproto";
import type { Client } from "@atcute/client";
import { createRecord, fetchAllRecords, type Repo, type Nsid } from "../atproto";

// network.cosmik.card — schema from cosmik-network/semble lexicons
export interface CosmikUrlCard {
  $type: "network.cosmik.card";
  type: "URL";
  content: {
    $type: "network.cosmik.card#urlContent";
    url: string;
    metadata?: {
      $type: "network.cosmik.card#urlMetadata";
      title?: string;
      description?: string;
      siteName?: string;
      imageUrl?: string;
      author?: string;
      type?: string;
    };
  };
  createdAt: string;
}

export interface CosmikNoteCard {
  $type: "network.cosmik.card";
  type: "NOTE";
  content: {
    $type: "network.cosmik.card#noteContent";
    text: string;
  };
  parentCard?: { uri: string; cid: string };
  createdAt: string;
}

export interface CosmikNoteOptions {
  text: string;
  parentCard?: { uri: string; cid: string };
}

export interface CosmikCollection {
  $type: "network.cosmik.collection";
  name: string;
  accessType: "OPEN" | "CLOSED";
  description?: string;
  createdAt: string;
}

export interface CosmikCollectionLink {
  $type: "network.cosmik.collectionLink";
  collection: { uri: string; cid: string };
  card: { uri: string; cid: string };
  addedBy: string;
  addedAt: string;
  createdAt: string;
}

export interface CosmikUrlCardOptions {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
}


export interface CosmikCollectionRef {
  uri: string;
  cid: string;
  name: string;
  description?: string;
}


export async function createCosmikUrlCard(
  rpc: Client,
  did: string,
  options: CosmikUrlCardOptions,
): Promise<{ uri: string; cid: string }> {
  const record: CosmikUrlCard = {
    $type: "network.cosmik.card",
    type: "URL",
    content: {
      $type: "network.cosmik.card#urlContent",
      url: options.url,
      ...((options.title || options.description || options.siteName || options.imageUrl) && {
        metadata: {
          $type: "network.cosmik.card#urlMetadata",
          ...(options.title && { title: options.title }),
          ...(options.description && { description: options.description }),
          ...(options.siteName && { siteName: options.siteName }),
          ...(options.imageUrl && { imageUrl: options.imageUrl }),
        },
      }),
    },
    createdAt: new Date().toISOString(),
  };

  return createRecord(rpc, did as Repo, "network.cosmik.card", record);
}


export async function createCosmikNoteCard(
  rpc: Client,
  did: string,
  options: CosmikNoteOptions,
): Promise<{ uri: string; cid: string }> {
  const record: CosmikNoteCard = {
    $type: "network.cosmik.card",
    type: "NOTE",
    content: {
      $type: "network.cosmik.card#noteContent",
      text: options.text,
    },
    ...(options.parentCard && { parentCard: options.parentCard }),
    createdAt: new Date().toISOString(),
  };

  return createRecord(rpc, did as Repo, "network.cosmik.card", record);
}

export async function linkCardToCollection(
  rpc: Client,
  did: string,
  card: { uri: string; cid: string },
  collection: { uri: string; cid: string },
): Promise<string> {
  const now = new Date().toISOString();
  const record: CosmikCollectionLink = {
    $type: "network.cosmik.collectionLink",
    collection,
    card,
    addedBy: did,
    addedAt: now,
    createdAt: now,
  };

  const { uri } = await createRecord(rpc, did as Repo, "network.cosmik.collectionLink", record);
  return uri;
}

export async function fetchCosmikCollections(
  rpc: Client,
  did: string,
): Promise<CosmikCollectionRef[]> {
  return fetchAllRecords(rpc, did as Repo, "network.cosmik.collection" as Nsid, (r) => {
    const v = r.value as CosmikCollection;
    return { uri: r.uri, cid: r.cid, name: v.name ?? "(untitled)", description: v.description };
  });
}