import { Person, Session, WorkerDB } from "lib/db";
import { getSessionExpirationDate } from "~/utils/auth.server";

export class SessionRepository {
  static async createSession(db: WorkerDB, personId: Person["id"]) {
    return db
      .insertInto("session")
      .values({
        id: crypto.randomUUID(),
        person_id: personId,
        expires_at: getSessionExpirationDate(),
      })
      .returning(["id", "expires_at", "person_id"])
      .executeTakeFirstOrThrow();
  }
  static async getSession(db: WorkerDB, id: Session["id"]) {
    return db
      .selectFrom("session")
      .where("id", "=", id)
      .select(["id", "expires_at", "person_id"])
      .executeTakeFirst();
  }
  static async deleteSession(db: WorkerDB, id: Session["id"]) {
    return db.deleteFrom("session").where("id", "=", id).execute();
  }
}
