import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";

import "./tailwind.css";
import { honeypot } from "./utils/honeypot.server";
import { getEnv } from "./utils/env.server";
import { getUserId, logout } from "./utils/auth.server.ts";
import { WorkerDb } from "lib/db";
import { useOptionalUser } from "./utils/user";
import { getAuthSessionStorage } from "./utils/session.server.ts";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);

  const honeyProps = honeypot.getInputProps();
  const userId = await getUserId(authSessionStorage, db, request);
  // TODO: Maybe better cache this.
  const user = userId
    ? await db
        .selectFrom("person")
        .where("id", "=", userId)
        .select(["id", "username"])
        .executeTakeFirst()
    : null;
  if (userId && !user) {
    console.info("something weird happened");
    // something weird happened... The user is authenticated but we can't find
    // them in the database. Maybe they were deleted? Let's log them out.
    await logout(authSessionStorage, {
      request,
      redirectTo: "/",
    });
  }
  return json({
    user,
    env: getEnv(context.cloudflare.env),
    honeyProps,
  });
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { env } = useLoaderData<typeof loader>();
  const user = useOptionalUser();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {user ? <div>Logged in as {user.username}</div> : null}
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function App() {
  return <Outlet />;
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  );
}
