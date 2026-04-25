<script lang="ts">
  import kipclipLogo from "../../assets/kipclip-logo.png?url";
  import sillLogo from "../../assets/sill-logo.png?url";
  import marginLogo from "../../assets/margin-logo.png?url";

  let {
    tags,
    checked = $bindable(false),
    checkedTags = $bindable<string[]>([]),
  }: {
    tags: string[];
    checked: boolean;
    checkedTags: string[];
  } = $props();

  function onTagChange() {
    if (checkedTags.length > 0) checked = true;
  }

  function onCheckedChange() {
    if (!checked) checkedTags = [];
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
      {#each tags as tag (tag)}
        <label class="accordion-item">
          <span class="item-name">{tag}</span>
          <input type="checkbox" bind:group={checkedTags} value={tag} onchange={onTagChange} />
        </label>
      {/each}
    {/if}
  </div>
</div>
