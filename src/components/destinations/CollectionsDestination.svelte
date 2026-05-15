<script lang="ts">
  import sembleLogo from "../../assets/semble-logo.png?url";
  import marginLogo from "../../assets/margin-logo.png?url";
  import rabbitholeLogo from "../../assets/rabbithole-logo.png?url";
  import AccordionFilter from "../AccordionFilter.svelte";
  import { ACCORDION_FILTER_THRESHOLD } from "../../lib/constants";

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
  let filter = $state("");

  const filtered = $derived(
    filter
      ? collections.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
      : collections
  );

  function toggle() {
    open = !open;
    if (open) loaded = true;
    else filter = "";
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
        {#if collections.length >= ACCORDION_FILTER_THRESHOLD}
          <AccordionFilter bind:value={filter} />
        {/if}
        <div class="accordion-scroll">
          {#if filtered.length === 0}
            <div class="accordion-msg">No matches.</div>
          {:else}
            {#each filtered as collection (collection.uri)}
              <label class="accordion-item">
                <span class="item-name">{collection.name}</span>
                <input
                  type="checkbox"
                  checked={checkedUris.includes(collection.uri)}
                  onchange={() => {
                    if (checkedUris.includes(collection.uri)) {
                      checkedUris = checkedUris.filter((u) => u !== collection.uri);
                    } else {
                      checkedUris = [...checkedUris, collection.uri];
                    }
                  }}
                />
              </label>
            {/each}
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
