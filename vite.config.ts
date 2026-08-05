// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    // Fix "createMiddleware is not a function" (TanStack Router #7459): nitro v3's
    // chunk-splitting emits the TanStack Start server entry and createMiddleware as a
    // circular ESM pair that crashes SSR. Bundling into a single chunk resolves the
    // evaluation-order crash and lets SSR boot.
    inlineDynamicImports: true,
    routeRules: {
      // Never cache the HTML document — every request re-validates so a fresh
      // deploy is visible immediately (no stale page after redeploys).
      "/**": { headers: { "cache-control": "no-cache, no-store, must-revalidate" } },
      // Fingerprinted assets are immutable by content hash — long cache is correct.
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
    },
  },
});
