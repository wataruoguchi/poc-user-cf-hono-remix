import { redirect } from "@remix-run/cloudflare";
import { safeRedirect } from "remix-utils/safe-redirect";
import { sessionKey } from "~/utils/auth.server.ts";
import { combineResponseInits } from "~/utils/misc.ts";
import { getAuthSessionStorage } from "~/utils/session.server";

export async function handleNewSession(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  {
    request,
    session,
    redirectTo,
    remember,
  }: {
    request: Request;
    session: { id: string; expires_at: Date };
    redirectTo?: string;
    remember: boolean;
  },
  responseInit?: ResponseInit
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  authSession.set(sessionKey, session.id);

  return redirect(
    safeRedirect(redirectTo),
    combineResponseInits(
      {
        headers: {
          "set-cookie": await authSessionStorage.commitSession(authSession, {
            expires: remember ? session.expires_at : undefined,
          }),
        },
      },
      responseInit
    )
  );
}
