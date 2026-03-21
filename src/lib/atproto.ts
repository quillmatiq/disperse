import type { Client } from "@atcute/client";

export type Repo = `did:${string}:${string}`;
export type Nsid = `${string}.${string}.${string}`;

export async function fetchAllRecords<T>(
  rpc: Client,
  repo: Repo,
  collection: Nsid,
  mapRecord: (r: { uri: string; cid: string; value: unknown }) => T,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;
  do {
    const res = await rpc.get("com.atproto.repo.listRecords", {
      params: { repo, collection, limit: 100, cursor },
    });
    if (!res.ok) break;
    for (const r of res.data.records) {
      results.push(mapRecord({ uri: r.uri, cid: r.cid, value: r.value }));
    }
    cursor = res.data.cursor;
  } while (cursor);
  return results;
}

export async function createRecord(
  rpc: Client,
  repo: Repo,
  collection: Nsid,
  record: unknown,
): Promise<{ uri: string; cid: string }> {
  const res = await rpc.post("com.atproto.repo.createRecord", {
    input: { repo, collection, record: record as Record<string, unknown> },
  });
  if (!res.ok) throw new Error(res.data.message ?? res.data.error ?? "Unknown error");
  return { uri: res.data.uri, cid: res.data.cid };
}

export function atUriRkey(uri: string): string {
  const rkey = uri.split("/").pop();
  if (!rkey) throw new Error(`Invalid AT-URI: ${uri}`);
  return rkey;
}

export async function putRecord(
  rpc: Client,
  repo: Repo,
  collection: Nsid,
  rkey: string,
  record: unknown,
): Promise<{ uri: string; cid: string }> {
  const res = await rpc.post("com.atproto.repo.putRecord", {
    input: { repo, collection, rkey, record: record as Record<string, unknown> },
  });
  if (!res.ok) throw new Error(res.data.message ?? res.data.error ?? "Unknown error");
  return { uri: res.data.uri, cid: res.data.cid };
}
