import { redirect } from "@remix-run/cloudflare";
import { WorkerDb, WorkerDB } from "lib/db";
import { getAuthSessionStorage } from "./session.server";

export const sessionKey = "sessionId";

export async function getUserId(env: Env, request: Request) {
  const authSessionStorage = getAuthSessionStorage(env);
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  if (!sessionId) return null;
  const db = await WorkerDb.getInstance(env);
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

export async function login(
  db: WorkerDB,
  {
    username,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    password,
  }: {
    username: string;
    password: string;
  }
) {
  const user = await db
    .selectFrom("person")
    .where("username", "=", username)
    .selectAll()
    .executeTakeFirst();
  // TODO: Return a session, not a user
  return user ? user : null;
}
