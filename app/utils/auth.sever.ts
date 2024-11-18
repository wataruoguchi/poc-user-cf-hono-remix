import { redirect } from "@remix-run/cloudflare";
import bcrypt from "bcryptjs";
import { Person, WorkerDb, WorkerDB } from "lib/db";
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
  return user && isValid ? user : null;
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
