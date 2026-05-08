<script lang="ts">
  import { onMount } from "svelte";
  import { getThemePref, setThemePref, type ThemePref } from "../lib/theme";
  import darkIcon from "../assets/dark-theme.svg?url";
  import systemIcon from "../assets/system-theme.svg?url";
  import lightIcon from "../assets/light-theme.svg?url";

  const options: { icon: string; value: ThemePref; aria: string }[] = [
    { icon: darkIcon,   value: "dark",   aria: "Dark mode" },
    { icon: systemIcon, value: "system", aria: "System default" },
    { icon: lightIcon,  value: "light",  aria: "Light mode" },
  ];

  let selected = $state<ThemePref>("system");

  onMount(() => {
    selected = getThemePref();

    const mql = matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      if (getThemePref() === "system") {
        document.documentElement.dataset.theme = mql.matches ? "dark" : "light";
      }
    }
    mql.addEventListener("change", onSystemChange);
    return () => mql.removeEventListener("change", onSystemChange);
  });

  function pick(pref: ThemePref) {
    selected = pref;
    setThemePref(pref);
  }
</script>

<div class="theme-picker" role="group" aria-label="Theme">
  {#each options as { icon, value, aria }}
    <button
      class="pick-btn"
      class:active={selected === value}
      onclick={() => pick(value)}
      aria-label={aria}
      aria-pressed={selected === value}
    >
      <img src={icon} alt="" class="pick-icon" />
    </button>
  {/each}
</div>

<style>
  .theme-picker {
    display: flex;
    gap: 0.2rem;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 999px;
    padding: 0.2rem;
  }

  .pick-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    padding: 0;
  }

  .pick-btn.active {
    background: var(--surface3);
  }

  .pick-icon {
    width: 14px;
    height: 14px;
    display: block;
    opacity: 0.4;
    transition: opacity 0.15s, filter 0.15s;
  }

  .pick-btn:hover:not(.active) .pick-icon,
  .pick-btn.active .pick-icon {
    opacity: 1;
  }

  :global([data-theme="dark"]) .pick-icon {
    filter: invert(0.52) sepia(0.15);
    opacity: 1;
  }

  :global([data-theme="dark"]) .pick-btn.active .pick-icon,
  :global([data-theme="dark"]) .pick-btn:hover:not(.active) .pick-icon {
    filter: invert(0.68) sepia(0.15);
  }
</style>
