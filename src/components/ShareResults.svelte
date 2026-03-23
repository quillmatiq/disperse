<script lang="ts">
  import blueskyLogo from "../assets/bluesky-logo.png?url";
  import blackskyLogo from "../assets/blacksky-logo.png?url";
  import sembleLogo from "../assets/semble-logo.png?url";
  import marginLogo from "../assets/margin-logo.png?url";
  import kipclipLogo from "../assets/kipclip-logo.png?url";
  import sillLogo from "../assets/sill-logo.png?url";

  export type Platform = "bluesky" | "blacksky" | "semble" | "margin" | "kipclip" | "sill";

  export interface ShareResult {
    platform: Platform;
    href: string;
  }

  const PLATFORM_META: Record<Platform, { logo: string; name: string }> = {
    bluesky:  { logo: blueskyLogo,  name: "Bluesky" },
    blacksky: { logo: blackskyLogo, name: "Blacksky" },
    semble:   { logo: sembleLogo,   name: "Semble" },
    margin:   { logo: marginLogo,   name: "Margin" },
    kipclip:  { logo: kipclipLogo,  name: "Kipclip" },
    sill:     { logo: sillLogo,     name: "Sill" },
  };

  let { results }: { results: ShareResult[] } = $props();
</script>

{#if results.length > 0}
  <div class="results">
    {#each results as result (result.href)}
      {@const meta = PLATFORM_META[result.platform]}
      <a href={result.href} target="_blank" rel="noopener noreferrer" class="result-link">
        <img src={meta.logo} alt="" class="result-logo" />
        Sent to {meta.name}
      </a>
    {/each}
  </div>
{/if}

<style>
  .results {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .result-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text);
    text-decoration: none;
  }

  .result-link:hover {
    text-decoration: underline;
  }

  .result-logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
  }
</style>
