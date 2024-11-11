/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("person")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("person").execute();
}
