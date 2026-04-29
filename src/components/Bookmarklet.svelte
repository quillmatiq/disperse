<script lang="ts">
  const href = "javascript:(function(){window.open('https://disperse.social/share?url='+encodeURIComponent(location.href),'disperse','width=540,height=800');})();";
</script>

<div class="bookmarklet-wrap">
  <p class="bookmarklet-label">Drag to your bookmarks bar for one-click sharing</p>
  <!-- svelte-ignore a11y_invalid_attribute -->
  <a class="bookmarklet-link" {href} draggable="true">Share with Disperse</a>
</div>

<style>
  .bookmarklet-wrap {
    margin-top: 1.25rem;
    text-align: center;
  }

  .bookmarklet-label {
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.6rem;
  }

  .bookmarklet-link {
    display: inline-block;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.35rem 0.85rem;
    text-decoration: none;
    cursor: grab;
    user-select: none;
    transition: background 0.15s, border-color 0.15s;
  }

  .bookmarklet-link:hover {
    background: var(--surface2);
    border-color: var(--accent);
  }

  .bookmarklet-link:active {
    cursor: grabbing;
  }
</style>
