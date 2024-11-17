import { WorkerDb } from "lib/db";

export async function login(
  env: Env,
  {
    username,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    password,
  }: {
    username: string;
    password: string;
  }
) {
  const db = await WorkerDb.getInstance(env);
  const user = await db
    .selectFrom("person")
    .where("username", "=", username)
    .selectAll()
    .executeTakeFirst();
  return user ? user : null;
}
