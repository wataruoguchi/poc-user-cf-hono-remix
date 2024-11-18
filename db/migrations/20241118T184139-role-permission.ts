/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("person")
    .alterColumn("username", (col) => col.setNotNull())
    .alterColumn("email", (col) => col.setNotNull())
    .alterColumn("created_at", (col) => col.setNotNull())
    .alterColumn("updated_at", (col) => col.setNotNull())
    .execute();
  await db.schema
    .alterTable("password")
    .addPrimaryKeyConstraint("password_pk", ["person_id"])
    .execute();
  await db.schema
    .alterTable("password")
    .addUniqueConstraint("password_person_id_unique", ["person_id"])
    .execute();
  await db.schema
    .alterTable("password")
    .alterColumn("hash", (col) => col.setNotNull())
    .alterColumn("person_id", (col) => col.setNotNull())
    .execute();
  await db.schema
    .createTable("role")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .addUniqueConstraint("role_name_unique", ["name"])
    .execute();
  await db.schema
    .createTable("permission")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("action", "text", (col) => col.notNull())
    .addColumn("entity", "text", (col) => col.notNull())
    .addColumn("access", "text", (col) => col.notNull())
    .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo("now()")
    )
    .addUniqueConstraint("permission_action_entity_unique", [
      "action",
      "entity",
      "access",
    ])
    .execute();
  await db.schema
    .createTable("role_person")
    .addColumn("role_id", "uuid", (col) =>
      col.references("role.id").onDelete("cascade").onUpdate("cascade")
    )
    .addColumn("person_id", "uuid", (col) =>
      col.references("person.id").onDelete("cascade").onUpdate("cascade")
    )
    .addUniqueConstraint("role_person_role_id_person_id_unique", [
      "role_id",
      "person_id",
    ])
    .addPrimaryKeyConstraint("role_person_pk", ["role_id", "person_id"])
    .execute();
  await db.schema
    .createTable("role_permission")
    .addColumn("role_id", "uuid", (col) =>
      col.references("role.id").onDelete("cascade").onUpdate("cascade")
    )
    .addColumn("permission_id", "uuid", (col) =>
      col.references("permission.id").onDelete("cascade").onUpdate("cascade")
    )
    .addUniqueConstraint("role_permission_role_id_permission_id_unique", [
      "role_id",
      "permission_id",
    ])
    .addPrimaryKeyConstraint("role_permission_pk", ["role_id", "permission_id"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("role_permission").execute();
  await db.schema.dropTable("role_person").execute();
  await db.schema.dropTable("permission").execute();
  await db.schema.dropTable("role").execute();
  await db.schema
    .alterTable("person")
    .alterColumn("id", (col) => col.dropDefault())
    .alterColumn("username", (col) => col.dropNotNull())
    .alterColumn("email", (col) => col.dropNotNull())
    .alterColumn("created_at", (col) => col.dropNotNull())
    .alterColumn("updated_at", (col) => col.dropNotNull())
    .execute();
  await db.schema
    .alterTable("password")
    .dropConstraint("password_pk")
    .execute();
  await db.schema
    .alterTable("password")
    .alterColumn("hash", (col) => col.dropNotNull())
    .alterColumn("person_id", (col) => col.dropNotNull())
    .execute();
}
