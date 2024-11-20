import {
  createPassword,
  createPermissions,
  createRoles,
  createUser,
} from "tests/db-utils";
import { WorkerDb } from "../../lib/db";

const SUPABASE_URI = process.env.SUPABASE_URI;
if (!SUPABASE_URI) {
  throw new Error("SUPABASE_URI is not set");
}
const db = await WorkerDb.getInstance({
  /**
   * https://supabase.com/docs/guides/database/connecting-to-postgres#supavisor-session-mode-port-5432
   */
  SUPABASE_URI: (SUPABASE_URI || "").replace(":6543", ":5432"),
});

// Run the seed function
seed()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
  })
  .finally(async () => {
    await WorkerDb.close();
  });

async function seed() {
  console.log("🌱 Seeding...");
  console.time(`🌱 Database has been seeded`);
  await db.deleteFrom("person").execute();
  await db.deleteFrom("role").execute();
  await db.deleteFrom("permission").execute();

  /**
   * Roles and permissions
   */
  const permissions = createPermissions();
  await db
    .insertInto("permission")
    .values(permissions)
    .returningAll()
    .execute();

  const roles = createRoles();
  await db.insertInto("role").values(roles).execute();

  /*
   * Assign permissions to roles
   */
  const adminRole = roles.find((role) => role.name === "admin");
  if (!adminRole) {
    throw new Error("Admin role not found");
  }
  const userRole = roles.find((role) => role.name === "user");
  if (!userRole) {
    throw new Error("User role not found");
  }
  await db
    .insertInto("role_permission")
    .values(
      permissions
        .filter((permission) => permission.access === "any") // For admin
        .map((permission) => ({
          role_id: adminRole.id,
          permission_id: permission.id,
        }))
    )
    .execute();
  await db
    .insertInto("role_permission")
    .values(
      permissions
        .filter((permission) => permission.access === "own") // For user
        .map((permission) => ({
          role_id: userRole.id,
          permission_id: permission.id,
        }))
    )
    .execute();

  /**
   * Users
   */
  const randomUsers = Array.from({ length: 10 }).map(() => createUser());
  const wataru = {
    id: crypto.randomUUID(),
    username: "wataru",
    email: "wataru@hey.com",
  };

  await db
    .insertInto("person")
    .values([wataru, ...randomUsers])
    .execute();

  await db
    .insertInto("password")
    .values([
      {
        hash: createPassword("password").hash,
        person_id: wataru.id,
      },
      ...randomUsers.map((user) => ({
        hash: createPassword(user.username).hash,
        person_id: user.id,
      })),
    ])
    .execute();

  /**
   * Assign roles to users
   */
  await db
    .insertInto("role_person")
    .values([{ person_id: wataru.id, role_id: adminRole.id }])
    .execute();
  await db
    .insertInto("role_person")
    .values(
      [wataru, ...randomUsers].map((user) => ({
        person_id: user.id,
        role_id: userRole.id,
      }))
    )
    .execute();

  console.timeEnd(`🌱 Database has been seeded`);
}
