import { Person, WorkerDB } from "lib/db";
import { parsePermissionString } from "~/utils/permissions.server";

export const UserRepository = {
  getUser,
  getUserWithPermissions,
  getTotalNumberOfUsers,
  getPasswordHash,
  updateUsername,
  deleteUser,
};

function getUser(
  db: WorkerDB,
  where:
    | { id: Person["id"] }
    | { username: Person["username"] }
    | { email: Person["email"] }
) {
  const whereClause =
    "id" in where ? "id" : "username" in where ? "username" : "email";
  const value =
    "id" in where
      ? where.id
      : "username" in where
      ? where.username
      : where.email;
  return db
    .selectFrom("person")
    .where(whereClause, "=", value)
    .select(["id", "username", "email", "created_at"])
    .executeTakeFirst();
}

async function getPasswordHash(
  db: WorkerDB,
  where:
    | { id: Person["id"] }
    | { username: Person["username"] }
    | { email: Person["email"] }
) {
  const whereClause =
    "id" in where ? "id" : "username" in where ? "username" : "email";
  const value =
    "id" in where
      ? where.id
      : "username" in where
      ? where.username
      : where.email;
  return await db
    .selectFrom("person")
    .innerJoin("password", "person.id", "password.person_id")
    .where(whereClause, "=", value)
    .select(["person.id", "password.hash"])
    .executeTakeFirst();
}

async function updateUsername(
  db: WorkerDB,
  id: Person["id"],
  username: Person["username"]
) {
  return db
    .updateTable("person")
    .where("id", "=", id)
    .set({ username })
    .execute();
}

async function deleteUser(db: WorkerDB, id: Person["id"]) {
  return db.deleteFrom("person").where("id", "=", id).execute();
}

function getTotalNumberOfUsers(db: WorkerDB) {
  return db
    .selectFrom("person")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirst();
}

async function getUserWithPermissions(
  db: WorkerDB,
  id: Person["id"],
  permissionData: ReturnType<typeof parsePermissionString>
) {
  return await db
    .selectFrom("person")
    .selectAll()
    .where("person.id", "=", id)
    .innerJoin("role_person", "role_person.person_id", "person.id")
    .innerJoin("role", "role.id", "role_person.role_id")
    .innerJoin("role_permission", "role_permission.role_id", "role.id")
    .innerJoin("permission", "permission.id", "role_permission.permission_id")
    .where((eb) =>
      eb.and([
        eb("permission.action", "=", permissionData.action),
        eb("permission.entity", "=", permissionData.entity),
        permissionData.access
          ? eb("permission.access", "in", permissionData.access)
          : eb.val(true),
      ])
    )
    .executeTakeFirst();
}
