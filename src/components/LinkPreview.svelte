<script lang="ts">
  import type { LinkMeta } from "../lib/lexicons/bsky";

  let { url, meta, loading }: { url: string; meta?: LinkMeta; loading: boolean } = $props();

  let imageError = $state(false);
  $effect(() => { url; imageError = false; });

  let domain = $derived((() => { try { return new URL(url).hostname; } catch { return ""; } })());
</script>

{#if loading || meta}
  <div class="preview">
    {#if loading}
      <div class="preview-loading">Loading preview…</div>
    {:else if meta}
      {#if meta.image && !imageError}
        <img src={meta.image} alt="" class="preview-thumb" onerror={() => (imageError = true)} />
      {/if}
      <div class="preview-info">
        {#if meta.title}<span class="preview-title">{meta.title}</span>{/if}
        <span class="preview-domain">{domain}</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .preview {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-top: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    min-height: 48px;
  }

  .preview-loading {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .preview-thumb {
    width: 48px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .preview-title {
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-domain {
    font-size: 0.75rem;
    color: var(--muted);
  }
</style>
