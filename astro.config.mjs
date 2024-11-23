import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import node from '@astrojs/node';
// import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://co2.ignitebright.com',
  vite: {
    ssr: {
      noExternal: ['entities']
    },
    build: {
      assets: '_assets',
      // Reduce chunk size warnings
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            vendor: ['react', 'react-dom'],
          },
        },
      },
    }
  },
  // base: '/co2-emission-tracker/',
  trailingSlash: 'never',
  output: 'static',
  build: {
    format: 'file',
  },
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
  adapter: node({
    mode: 'standalone',
    env: true
  })
});
