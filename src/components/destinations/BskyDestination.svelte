<script lang="ts">
  import blueskyLogo from "../../assets/bluesky-logo.png?url";
  import blackskyLogo from "../../assets/blacksky-logo.png?url";

  let { checked = $bindable(false) } = $props();
</script>

<label class="dest-row">
  <span class="dest-name">Microblogs</span>
  <img class="dest-icon" src={blueskyLogo} alt="Bluesky" title="bsky.app" />
  <img class="dest-icon" src={blackskyLogo} alt="Blacksky" title="blacksky.community" />
  <input type="checkbox" bind:checked />
</label>
