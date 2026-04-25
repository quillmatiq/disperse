<script lang="ts">
  import sembleLogo from "../../assets/semble-logo.png?url";
  import marginLogo from "../../assets/margin-logo.png?url";
  import rabbitholeLogo from "../../assets/rabbithole-logo.png?url";

  interface Collection {
    uri: string;
    name: string;
    source: "cosmik" | "margin";
  }

  let {
    collections,
    checkedUris = $bindable<string[]>([]),
  }: {
    collections: Collection[];
    checkedUris: string[];
  } = $props();

  let open = $state(false);
  let loaded = $state(false);

  function toggle() {
    open = !open;
    if (open) loaded = true;
  }
</script>

<div class="dest-row" role="button" tabindex="0"
  onclick={toggle}
  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
>
  <span class="dest-name">Collections</span>
  <img class="dest-icon" src={sembleLogo} alt="Semble" title="semble.so" />
  <img class="dest-icon" src={marginLogo} alt="Margin" title="margin.at" />
  <img class="dest-icon" src={rabbitholeLogo} alt="Rabbithole" title="rabbithole.land" />
  <svg class="dest-chevron" class:open width="12" height="8" viewBox="0 0 12 8" fill="none">
    <path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
<div class="accordion" class:open>
  <div class="accordion-inner">
    {#if loaded}
      {#if collections.length === 0}
        <div class="accordion-msg">No collections found.</div>
      {:else}
        {#each collections as collection (collection.uri)}
          <label class="accordion-item">
            <span class="item-name">{collection.name}</span>
            <input type="checkbox" bind:group={checkedUris} value={collection.uri} />
          </label>
        {/each}
      {/if}
    {/if}
  </div>
</div>
