/**
 * Supabase x Kysely.
 * Supabase should appear only in this file.
 */
import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import { type KyselifyDatabase } from "kysely-supabase";
import postgres from "postgres";
import { type Database } from "../db/supabase.types";

type DB = KyselifyDatabase<Database>;
export class WorkerDb {
  private static instance: Kysely<DB> | null = null;

  static async getInstance(
    env: Pick<Env, "SUPABASE_URI">
  ): Promise<Kysely<DB>> {
    if (!this.instance) {
      const pg = postgres(env.SUPABASE_URI);
      /**
       * The following two lines are to check if the connection is successful.
       */
      const reserved = await pg.reserve();
      await reserved.unsafe("SELECT 1");

      this.instance = new Kysely<DB>({
        dialect: new PostgresJSDialect({
          postgres: pg,
        }),
      });
    }
    return this.instance;
  }
}
