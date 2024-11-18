import { redirect } from "@remix-run/cloudflare";
import bcrypt from "bcryptjs";
import { Person, WorkerDB } from "lib/db";
import { safeRedirect } from "remix-utils/safe-redirect";
import { combineHeaders } from "./misc";
import { getAuthSessionStorage } from "./session.server";

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export const sessionKey = "sessionId";

export async function getUserId(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  db: WorkerDB,
  request: Request
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  if (!sessionId) return null;
  const session = await db
    .selectFrom("person") // TODO: Use session table
    .where("id", "=", sessionId)
    .select("id")
    .executeTakeFirst();
  if (!session) {
    throw redirect("/", {
      headers: {
        "set-cookie": await authSessionStorage.destroySession(authSession),
      },
    });
  }
  return session.id;
}

export async function requireUserId(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  db: WorkerDB,
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) {
  const userId = await getUserId(authSessionStorage, db, request);
  if (!userId) {
    const requestUrl = new URL(request.url);
    redirectTo =
      redirectTo === null
        ? null
        : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
    const loginRedirect = ["/login", loginParams?.toString()]
      .filter(Boolean)
      .join("?");
    throw redirect(loginRedirect);
  }
  return userId;
}

export async function requireAnonymous(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  db: WorkerDB,
  request: Request
) {
  const userId = await getUserId(authSessionStorage, db, request);
  if (userId) {
    throw redirect("/");
  }
}

export async function login(
  db: WorkerDB,
  {
    username,
    password,
  }: {
    username: Person["username"];
    password: string;
  }
) {
  // TODO: Loop up session table
  const user = await db
    .selectFrom("person")
    .where("username", "=", username)
    .selectAll()
    .executeTakeFirst();
  if (!user) return null;
  const isValid = await verifyUserPassword(db, { id: user.id }, password);
  // TODO: Return a session, not a user
  return user && isValid
    ? { ...user, expirationDate: getSessionExpirationDate() }
    : null;
}

export async function verifyUserPassword(
  db: WorkerDB,
  where: Pick<Person, "id">,
  password: string
) {
  // TODO: Join with person table. Support looking up by username as well.
  const passwordForPersonId = await db
    .selectFrom("password")
    .where("person_id", "=", where.id)
    .select("hash")
    .executeTakeFirst();

  if (!passwordForPersonId || !passwordForPersonId.hash) {
    return null;
  }

  // TODO: Add rate limiting.
  const isValid = await bcrypt.compare(password, passwordForPersonId.hash);

  if (!isValid) {
    return null;
  }

  return { id: where.id };
}

export async function logout(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  {
    request,
    redirectTo = "/",
  }: {
    request: Request;
    redirectTo?: string;
  },
  responseInit?: ResponseInit
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  // TODO: Create session table
  // const sessionId = authSession.get(sessionKey);
  // // if this fails, we still need to delete the session from the user's browser
  // // and it doesn't do any harm staying in the db anyway.
  // if (sessionId) {
  //   // the .catch is important because that's what triggers the query.
  //   // learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
  //   void prisma.session
  //     .deleteMany({ where: { id: sessionId } })
  //     .catch(() => {});
  // }
  throw redirect(safeRedirect(redirectTo), {
    ...responseInit,
    headers: combineHeaders(
      { "set-cookie": await authSessionStorage.destroySession(authSession) },
      responseInit?.headers
    ),
  });
}
