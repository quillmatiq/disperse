import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import svelte from "@astrojs/svelte";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),

  vite: {
    server: {
      allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io', '.ngrok.app'],
    },
  },

  integrations: [svelte()],
});