import { FileMigrationProvider, Migrator } from "kysely";
import { run } from "kysely-migration-cli";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { WorkerDb } from "../../lib/db";

const SUPABASE_URI = process.env.SUPABASE_URI;
if (!SUPABASE_URI) {
  throw new Error("SUPABASE_URI is not set");
}

// For ESM environment
const migrationFolder = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../migrations"
);
const db = await WorkerDb.getInstance({
  /**
   * https://supabase.com/docs/guides/database/connecting-to-postgres#supavisor-session-mode-port-5432
   */
  SUPABASE_URI: (SUPABASE_URI || "").replace(":6543", ":5432"),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
});

run(db, migrator, migrationFolder);
