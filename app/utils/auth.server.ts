import { redirect } from "@remix-run/cloudflare";
import bcrypt from "bcryptjs";
import { DB, Person } from "lib/db";
import { safeRedirect } from "remix-utils/safe-redirect";
import { SessionRepository } from "repositories/session";
import { UserRepository } from "repositories/user";
import { combineHeaders } from "./misc";
import { getAuthSessionStorage } from "./session.server";

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export const sessionKey = "sessionId";

export async function getUserId(env: Env, db: DB, request: Request) {
  const authSession = await getAuthSessionStorage(env).getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  if (!sessionId) return null;
  const session = await SessionRepository.getSession(db, sessionId);
  if (!session) {
    throw redirect("/", {
      headers: {
        "set-cookie": await getAuthSessionStorage(env).destroySession(
          authSession
        ),
      },
    });
  }
  return session.person_id;
}

export async function requireUserId(
  env: Env,
  db: DB,
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) {
  const userId = await getUserId(env, db, request);
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

export async function requireAnonymous(env: Env, db: DB, request: Request) {
  const userId = await getUserId(env, db, request);
  if (userId) {
    throw redirect("/");
  }
}

export async function login(
  db: DB,
  {
    username,
    password,
  }: {
    username: Person["username"];
    password: string;
  }
) {
  const person = await verifyUserPassword(db, { username }, password);
  if (!person) return null;
  // Create a session
  const session = await SessionRepository.createSession(db, person.id);
  return session || null;
}

export async function signup(
  db: DB,
  {
    email,
    username,
    password,
  }: {
    email: Person["email"];
    username: Person["username"];
    password: string;
  }
) {
  const hashedPassword = await getPasswordHash(password);
  const session = await db.transaction().execute(async (trx) => {
    const person = await UserRepository.createUser(trx, {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
    });
    await trx
      .insertInto("password")
      .values({
        person_id: person.id,
        hash: hashedPassword,
      })
      .execute();
    return await SessionRepository.createSession(trx, person.id);
  });

  return session;
}

export async function logout(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  db: DB,
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
  const sessionId = authSession.get(sessionKey);
  void SessionRepository.deleteSession(db, sessionId).catch(() => {
    /* Do nothing intentionally. */
  });
  throw redirect(safeRedirect(redirectTo), {
    ...responseInit,
    headers: combineHeaders(
      { "set-cookie": await authSessionStorage.destroySession(authSession) },
      responseInit?.headers
    ),
  });
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyUserPassword(
  db: DB,
  where: { id: Person["id"] } | { username: Person["username"] },
  password: string
): Promise<{ id: Person["id"] } | null> {
  const passwordForPerson = await UserRepository.getPasswordHash(db, where);
  if (!passwordForPerson || !passwordForPerson.hash) {
    return null;
  }

  // TODO: Add rate limiting.
  const isValid = await bcrypt.compare(password, passwordForPerson.hash);

  if (!isValid) {
    return null;
  }

  return { id: passwordForPerson.id };
}
