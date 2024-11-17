import { WorkerDB } from "lib/db";

export const sessionKey = "sessionId";

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
