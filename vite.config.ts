import adapter from "@hono/vite-dev-server/cloudflare";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import serverAdapter from "hono-remix-adapter/vite";
import path from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    serverAdapter({
      adapter,
      getLoadContext,
      entry: "server/index.ts",
    }),
    tsconfigPaths(),
  ],
  /**
   * In development, we need to use Node.js's postgres package instead of the cloudflare one.
   * https://github.com/remix-run/remix/issues/9245#issuecomment-2179517678
   * https://vite.dev/config/ssr-options.html#ssr-noexternal
   */
  ssr: {
    noExternal: ["postgres"],
  },
  resolve: {
    alias: {
      ...(mode === "development" && {
        postgres: path.resolve(__dirname, "node_modules/postgres/src/index.js"),
      }),
    },
  },
}));
