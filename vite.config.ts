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
  // Explicitly target the Node runtime on Vercel. The default `vercel` web preset
  // (also reachable via a NITRO_PRESET=vercel env var) splits createMiddleware into
  // a circular ESM pair and crashes SSR with "TypeError: createMiddleware is not a
  // function". The `node-server` preset bundles the same code into a single module and
  // runs cleanly on Vercel's classic Node runtime.
  nitro: { preset: "node-server" },
});
