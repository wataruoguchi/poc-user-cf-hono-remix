import adapter from "@hono/vite-dev-server/cloudflare";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import serverAdapter from "hono-remix-adapter/vite";
import path from "node:path";
import { flatRoutes } from "remix-flat-routes";
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
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            ".*",
            "**/*.css",
            "**/*.test.{js,jsx,ts,tsx}",
            "**/__*.*",
            // This is for server-side utilities you want to colocate
            // next to your routes without making an additional
            // directory. If you need a route that includes "server" or
            // "client" in the filename, use the escape brackets like:
            // my-route.[server].tsx
            "**/*.server.*",
            "**/*.client.*",
          ],
        });
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
  ...(mode === "development" && {
    ssr: {
      noExternal: ["postgres"],
    },
    resolve: {
      alias: {
        postgres: path.resolve(__dirname, "node_modules/postgres/src/index.js"),
      },
    },
  }),
}));
