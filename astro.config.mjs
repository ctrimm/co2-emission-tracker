import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
// import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  site: 'https://co2.ignitebright.com',
  // base: '/co2-emission-tracker/',
  trailingSlash: 'never',
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'github-dark-dimmed' },
      gfm: true,
    }),
    // sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  // adapter: vercel({
  //   analytics: true,
  // }),
});
