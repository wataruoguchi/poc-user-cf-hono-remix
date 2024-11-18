import { createPassword, createUser } from "tests/db-utils";
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
  // Delete existing records (optional)
  await db.deleteFrom("person").execute();
  await db.deleteFrom("password").execute();

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

  console.timeEnd(`🌱 Database has been seeded`);
}
