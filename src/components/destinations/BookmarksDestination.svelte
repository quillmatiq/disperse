<script lang="ts">
  import kipclipLogo from "../../assets/kipclip-logo.png?url";
  import sillLogo from "../../assets/sill-logo.png?url";
  import marginLogo from "../../assets/margin-logo.png?url";
  import AccordionFilter from "../AccordionFilter.svelte";
  import { ACCORDION_FILTER_THRESHOLD } from "../../lib/constants";

  let {
    tags,
    checked = $bindable(false),
    checkedTags = $bindable<string[]>([]),
  }: {
    tags: string[];
    checked: boolean;
    checkedTags: string[];
  } = $props();

  let filter = $state("");

  const filteredTags = $derived(
    filter
      ? tags.filter((t) => t.toLowerCase().includes(filter.toLowerCase()))
      : tags
  );

  function onCheckedChange() {
    if (!checked) {
      checkedTags = [];
      filter = "";
    }
  }
</script>

<label class="dest-row">
  <span class="dest-name">Bookmarks</span>
  <img class="dest-icon" src={kipclipLogo} alt="Kipclip" title="kipclip.com" />
  <img class="dest-icon" src={sillLogo} alt="Sill" title="sill.social" />
  <img class="dest-icon" src={marginLogo} alt="Margin" title="margin.at" />
  <input type="checkbox" bind:checked onchange={onCheckedChange} />
</label>
<div class="accordion" class:open={checked}>
  <div class="accordion-inner">
    {#if tags.length === 0}
      <div class="accordion-msg">No tags found.</div>
    {:else}
      {#if tags.length >= ACCORDION_FILTER_THRESHOLD}
        <AccordionFilter bind:value={filter} />
      {/if}
      <div class="accordion-scroll">
        {#if filteredTags.length === 0}
          <div class="accordion-msg">No matches.</div>
        {:else}
          {#each filteredTags as tag (tag)}
            <label class="accordion-item">
              <span class="item-name">{tag}</span>
              <input
                type="checkbox"
                checked={checkedTags.includes(tag)}
                onchange={() => {
                  if (checkedTags.includes(tag)) {
                    checkedTags = checkedTags.filter((t) => t !== tag);
                  } else {
                    checkedTags = [...checkedTags, tag];
                    checked = true;
                  }
                }}
              />
            </label>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>
