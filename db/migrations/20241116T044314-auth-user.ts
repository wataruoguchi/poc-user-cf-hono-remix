/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("person")
    .addColumn("email", "text")
    .addColumn("username", "text")
    .addColumn("created_at", "timestamp", (col) => col.defaultTo("now()"))
    .addColumn("updated_at", "timestamp", (col) => col.defaultTo("now()"))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("person")
    .dropColumn("email")
    .dropColumn("username")
    .dropColumn("created_at")
    .dropColumn("updated_at")
    .execute();
}
