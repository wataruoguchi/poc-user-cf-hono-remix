/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("session")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("person_id", "uuid", (col) =>
      col
        .notNull()
        .references("person.id")
        .onDelete("cascade")
        .onUpdate("cascade")
    )
    .addColumn("expires_at", "timestamp", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("session").execute();
}
