<script lang="ts">
  let {
    value = $bindable(""),
  }: {
    value: string;
  } = $props();
</script>

<div class="accordion-filter">
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.4"/>
    <path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
  <input type="text" bind:value placeholder="Filter…" onkeydown={(e) => e.key === "Escape" && (value = "")} />
  {#if value}
    <button class="accordion-filter-clear" onclick={() => value = ""} aria-label="Clear filter">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}
</div>
