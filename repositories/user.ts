import { DB, WorkerDB } from "lib/db";
import { parsePermissionString } from "~/utils/permissions.server";

export const UserRepository = {
  getUserById,
  getUserByUsername,
  getUserByEmail,
  getUserWithPermissions,
  getTotalNumberOfUsers,
  hasPassword,
  updateUsername,
  deleteUser,
};

function getUserById(db: WorkerDB, id: DB["person"]["id"]) {
  return db
    .selectFrom("person")
    .where("id", "=", id)
    .select(["id", "username", "email"])
    .executeTakeFirst();
}

async function getUserByUsername(
  db: WorkerDB,
  username: DB["person"]["username"]
) {
  return db
    .selectFrom("person")
    .where("username", "=", username)
    .select(["id", "username", "email", "created_at"])
    .executeTakeFirst();
}

async function getUserByEmail(db: WorkerDB, email: DB["person"]["email"]) {
  return db
    .selectFrom("person")
    .where("email", "=", email)
    .select(["id", "username", "email"])
    .executeTakeFirst();
}

async function updateUsername(
  db: WorkerDB,
  id: DB["person"]["id"],
  username: DB["person"]["username"]
) {
  return db
    .updateTable("person")
    .where("id", "=", id)
    .set({ username })
    .execute();
}

async function deleteUser(db: WorkerDB, id: DB["person"]["id"]) {
  return db.deleteFrom("person").where("id", "=", id).execute();
}

function getTotalNumberOfUsers(db: WorkerDB) {
  return db
    .selectFrom("person")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirst();
}

async function hasPassword(
  db: WorkerDB,
  id: DB["person"]["id"]
): Promise<boolean> {
  const r = await db
    .selectFrom("password")
    .where("person_id", "=", id)
    .select(["hash"])
    .executeTakeFirst();
  return Boolean(r);
}

async function getUserWithPermissions(
  db: WorkerDB,
  id: DB["person"]["id"],
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
