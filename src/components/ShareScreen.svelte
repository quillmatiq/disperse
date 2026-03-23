<script lang="ts">
  import { onMount } from "svelte";
  import { getActiveSession, logout, refreshSession } from "../lib/auth";
  import { fetchProfile, createBskyPost, uploadImageBlob, type LinkMeta } from "../lib/lexicons/bsky";
  import { fetchCosmikCollections, createCosmikUrlCard, createCosmikNoteCard, linkCardToCollection, type CosmikCollectionRef } from "../lib/lexicons/cosmik";
  import { fetchMarginCollections, createMarginBookmark, linkBookmarkToCollection, type MarginCollectionRef } from "../lib/lexicons/margin";
  import { fetchKipclipTags, fetchReadingListTag, createKipclipAnnotation, type KipclipTagRef } from "../lib/lexicons/kipclip";
  import { createBookmark } from "../lib/lexicons/bookmarks";
  import { toMessage } from "../lib/utils";
  import type { OAuthUserAgent } from "@atcute/oauth-browser-client";
  import type { Client } from "@atcute/client";

  import BskyDestination from "./destinations/BskyDestination.svelte";
  import CollectionsDestination from "./destinations/CollectionsDestination.svelte";
  import BookmarksDestination from "./destinations/BookmarksDestination.svelte";
  import ShareResults, { type ShareResult } from "./ShareResults.svelte";

  // Session
  let agent = $state<OAuthUserAgent | null>(null);
  let rpc = $state<Client | null>(null);
  let did = $state<string | null>(null);
  let profile = $state<{ handle: string; avatar?: string } | null>(null);
  let avatarError = $state(false);
  let menuOpen = $state(false);
  let menuRef = $state<HTMLElement | null>(null);

  // Data
  let cosmikCollections = $state<CosmikCollectionRef[]>([]);
  let marginCollections = $state<MarginCollectionRef[]>([]);
  let kipclipTags = $state<KipclipTagRef[]>([]);
  let readingListTag = $state("toread");

  // Form
  let text = $state("");
  let url = $state("");
  let destBsky = $state(false);
  let destBookmarks = $state(false);
  let checkedCollectionUris = $state<string[]>([]);
  let checkedTags = $state<string[]>([]);

  // UI
  let sending = $state(false);
  let statusType = $state<"idle" | "ok" | "error">("idle");
  let statusText = $state("");
  let results = $state<ShareResult[]>([]);

  let statusClass = $derived(
    statusType === "ok" ? "status ok" : statusType === "error" ? "status error" : "status"
  );

  // Derived
  let allCollections = $derived([
    ...cosmikCollections.map((c) => ({ ...c, source: "cosmik" as const })),
    ...marginCollections.map((c) => ({ ...c, source: "margin" as const })),
  ]);

  let tagValues = $derived(kipclipTags.map((t) => t.value));
  let allTags = $derived(
    tagValues.includes(readingListTag) ? tagValues : [readingListTag, ...tagValues]
  );

  let canSend = $derived(
    !sending &&
    (!!url.trim() || !!text.trim()) &&
    (destBsky || destBookmarks || checkedCollectionUris.length > 0)
  );

  let charCountClass = $derived(
    text.length > 280 ? "char-count over" : text.length > 240 ? "char-count warn" : "char-count"
  );

  onMount(async () => {
    const active = await getActiveSession();
    if (!active) {
      window.location.replace("/login");
      return;
    }
    agent = active.agent;
    rpc = active.rpc;
    did = active.session.info.sub;

    const [prof, cosmik, margin, tags, rlt] = await Promise.all([
      fetchProfile(active.rpc, did),
      fetchCosmikCollections(active.rpc, did).catch(() => [] as CosmikCollectionRef[]),
      fetchMarginCollections(active.rpc, did).catch(() => [] as MarginCollectionRef[]),
      fetchKipclipTags(active.rpc, did).catch(() => [] as KipclipTagRef[]),
      fetchReadingListTag(active.rpc, did).catch(() => readingListTag),
    ]);
    profile = prof;
    cosmikCollections = cosmik;
    marginCollections = margin;
    kipclipTags = tags;
    readingListTag = rlt;

    refreshSession(did).catch((err) => console.warn("Session refresh failed:", err));
  });

  function onWindowClick(e: MouseEvent) {
    if (menuOpen && menuRef && !menuRef.contains(e.target as Node)) {
      menuOpen = false;
    }
  }

  async function handleLogout() {
    if (agent) await logout(agent);
    window.location.replace("/login");
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!rpc || !did) return;
    sending = true;
    statusText = "Sending…";
    statusType = "idle";
    results = [];

    const trimmedUrl = url.trim();
    const trimmedText = text.trim();

    let linkMeta: LinkMeta | undefined;
    let thumb: Awaited<ReturnType<typeof uploadImageBlob>> = undefined;
    if (trimmedUrl) {
      try {
        const metaRes = await fetch(`/api/link-meta?url=${encodeURIComponent(trimmedUrl)}`);
        if (metaRes.ok) linkMeta = await metaRes.json();
      } catch { /* skip metadata on failure */ }
      if (linkMeta?.image) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(linkMeta.image)}`;
        thumb = await uploadImageBlob(rpc, proxyUrl);
      }
    }

    const newResults: ShareResult[] = [];
    const errors: string[] = [];
    const handle = profile?.handle ?? (did as string); // used for Bluesky links

    if (destBsky) {
      try {
        const uri = await createBskyPost(rpc, did, {
          text: trimmedText || " ",
          url: trimmedUrl || undefined,
          linkMeta,
          thumb,
        });
        const rkey = uri.split("/").pop()!;
        newResults.push(
          { platform: "bluesky",  href: `https://bsky.app/profile/${handle}/post/${rkey}` },
          { platform: "blacksky", href: `https://blacksky.community/profile/${handle}/post/${rkey}` },
        );
      } catch (err) {
        errors.push(`Bluesky: ${toMessage(err)}`);
      }
    }

    if (trimmedUrl && destBookmarks) {
      try {
        const bookmark = await createBookmark(rpc, did, trimmedUrl, checkedTags.length > 0 ? checkedTags : undefined);
        newResults.push(
          { platform: "kipclip", href: "https://kipclip.com" },
          { platform: "sill",    href: "https://sill.social/bookmarks" },
        );
        try {
          await createKipclipAnnotation(rpc, did, {
            bookmarkUri: bookmark.uri,
            title: linkMeta?.title,
            description: linkMeta?.description,
            image: linkMeta?.image,
            note: trimmedText || undefined,
          });
        } catch (err) {
          errors.push(`Kipclip annotation: ${toMessage(err)}`);
        }
      } catch (err) {
        errors.push(`Bookmarks: ${toMessage(err)}`);
      }
    }

    const checkedCollections = allCollections.filter((c) => checkedCollectionUris.includes(c.uri));
    const marginColls = checkedCollections.filter((c) => c.source === "margin");
    const cosmikColls = checkedCollections.filter(
      (c): c is CosmikCollectionRef & { source: "cosmik" } => c.source === "cosmik"
    );

    let marginBookmarkUri: string | undefined;
    let cosmikCardUri: string | undefined;

    if (trimmedUrl && marginColls.length > 0) {
      try {
        const bookmark = await createMarginBookmark(rpc, did, {
          url: trimmedUrl,
          title: linkMeta?.title,
          description: trimmedText || undefined,
        });
        marginBookmarkUri = bookmark.uri;
        for (const coll of marginColls) {
          try {
            await linkBookmarkToCollection(rpc, did, bookmark.uri, coll.uri);
          } catch (err) {
            errors.push(`Margin (${coll.name}): ${toMessage(err)}`);
          }
        }
      } catch (err) {
        errors.push(`Margin: ${toMessage(err)}`);
      }
    }

    if (trimmedUrl && cosmikColls.length > 0) {
      try {
        const card = await createCosmikUrlCard(rpc, did, {
          url: trimmedUrl,
          title: linkMeta?.title,
          description: linkMeta?.description,
          siteName: linkMeta?.siteName,
          imageUrl: linkMeta?.image,
        });
        cosmikCardUri = card.uri;
        if (trimmedText) {
          try {
            await createCosmikNoteCard(rpc, did, { text: trimmedText, parentCard: card });
          } catch (err) {
            errors.push(`Cosmik note: ${toMessage(err)}`);
          }
        }
        for (const coll of cosmikColls) {
          try {
            await linkCardToCollection(rpc, did, card, coll);
          } catch (err) {
            errors.push(`Cosmik (${coll.name}): ${toMessage(err)}`);
          }
        }
      } catch (err) {
        errors.push(`Cosmik: ${toMessage(err)}`);
      }
    }

    if (cosmikCardUri) {
      newResults.push({ platform: "semble", href: `https://semble.so/url?id=${encodeURIComponent(trimmedUrl)}` });
      if (!marginBookmarkUri) {
        // Cosmik-only: the card also appears on margin.at
        newResults.push({ platform: "margin", href: `https://margin.at/at/${did}/${cosmikCardUri.split("/").pop()}` });
      }
    }

    if (marginBookmarkUri) {
      newResults.push({ platform: "margin", href: `https://margin.at/at/${did}/${marginBookmarkUri.split("/").pop()}` });
      if (!cosmikCardUri) {
        // Margin-only: the URL is also discoverable on semble
        newResults.push({ platform: "semble", href: `https://semble.so/url?id=${encodeURIComponent(trimmedUrl)}` });
      }
    }

    if (errors.length > 0) {
      statusText = errors.join(" · ");
      statusType = "error";
    } else {
      statusText = "Sent.";
      statusType = "ok";
      text = "";
      url = "";
    }
    results = newResults;
    sending = false;
  }
</script>

<svelte:window onclick={onWindowClick} />

<section id="share-screen" class="card">
  <header>
    <h1>Disperse</h1>
    <div class="menu-trigger" bind:this={menuRef}>
      <button class="avatar-btn" onclick={() => (menuOpen = !menuOpen)} aria-label="Account menu">
        {#if profile?.avatar && !avatarError}
          <img class="avatar" src={profile.avatar} alt="" onerror={() => (avatarError = true)} />
        {:else}
          <div class="avatar-fallback"></div>
        {/if}
      </button>
      {#if menuOpen}
        <div class="dropdown">
          <div class="dropdown-profile">
            {#if profile?.avatar && !avatarError}
              <img class="avatar" src={profile.avatar} alt="" onerror={() => (avatarError = true)} />
            {:else}
              <div class="avatar-fallback"></div>
            {/if}
            <span class="handle">{profile?.handle ?? ""}</span>
          </div>
          <hr />
          <button class="dropdown-item" onclick={handleLogout}>Sign out</button>
        </div>
      {/if}
    </div>
  </header>

  <form onsubmit={handleSubmit}>
    <div class="field">
      <label for="post-text">Note <span class="opt">(optional)</span></label>
      <textarea id="post-text" rows="3" maxlength="300" placeholder="Add a note…" bind:value={text}></textarea>
      <span class={charCountClass}>{text.length} / 300</span>
    </div>

    <div class="field">
      <label for="post-url">Link</label>
      <input id="post-url" type="url" placeholder="https://…" bind:value={url} />
    </div>

    <span class="dest-label">Share to</span>
    <div class="destinations">
      <BskyDestination bind:checked={destBsky} />
      <CollectionsDestination collections={allCollections} bind:checkedUris={checkedCollectionUris} />
      <BookmarksDestination tags={allTags} bind:checked={destBookmarks} bind:checkedTags />
    </div>

    <button type="submit" disabled={!canSend}>Send</button>
  </form>

  <div class={statusClass}>{statusText}</div>
  <ShareResults {results} />
</section>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .menu-trigger {
    position: relative;
  }

  .avatar-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .avatar-fallback {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--muted);
    flex-shrink: 0;
  }

  .dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 180px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    overflow: hidden;
  }

  .dropdown-profile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .handle {
    font-size: 0.75rem;
    color: var(--muted);
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown hr {
    margin: 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.65rem 0.75rem;
    background: none;
    border: none;
    text-align: left;
    font-size: 0.875rem;
    cursor: pointer;
    color: var(--text);
  }

  .dropdown-item:hover {
    background: var(--hover, rgba(0, 0, 0, 0.05));
  }

  .char-count {
    display: block;
    text-align: right;
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.35rem;
  }
  .char-count.warn { color: #e0a555; }
  .char-count.over { color: var(--error); }

  .dest-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.45rem;
  }

</style>
