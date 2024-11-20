/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("person")
    .addUniqueConstraint("person_username_unique", ["username"])
    .execute();
  await db.schema
    .alterTable("person")
    .addUniqueConstraint("person_email_unique", ["email"])
    .execute();

  await db.schema
    .createTable("password")
    .addColumn("hash", "text")
    .addColumn("person_id", "uuid", (col) =>
      col.references("person.id").onDelete("cascade").onUpdate("cascade")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("person")
    .dropConstraint("person_username_unique")
    .execute();

  await db.schema
    .alterTable("person")
    .dropConstraint("person_email_unique")
    .execute();

  await db.schema.dropTable("password").execute();
}
