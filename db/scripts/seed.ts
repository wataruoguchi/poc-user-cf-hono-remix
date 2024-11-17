import { faker } from "@faker-js/faker";
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

  // Insert sample data
  await db
    .insertInto("person")
    .values([
      {
        id: crypto.randomUUID(),
        username: "wataru",
        email: "wataru@hey.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...Array.from({ length: 10 }).map(() => ({
        id: crypto.randomUUID(),
        username: faker.internet.username().toLowerCase(),
        email: faker.internet.email(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    ])
    .execute();

  console.timeEnd(`🌱 Database has been seeded`);
}
