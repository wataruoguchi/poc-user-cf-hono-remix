// https://github.com/yusukebe/hono-remix-adapter/blob/main/example/load-context.ts

import { type AppLoadContext } from "@remix-run/cloudflare";
import { type PlatformProxy } from "wrangler";

interface Env {
  MY_VAR: string;
}

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}
type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare };
}) => AppLoadContext;

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export const getLoadContext: GetLoadContext = ({ context }) => {
  return {
    ...context,
    extra: 'stuff'
  };
};
