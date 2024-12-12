/**
 * Supabase x Kysely.
 * Supabase should appear only in this file.
 */
import { Kysely } from "kysely";
import { DB as KyselyCodegenDB } from "kysely-codegen";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";

export type Person = KyselyCodegenDB["person"];
export type Session = KyselyCodegenDB["session"];
export type DB = Kysely<KyselyCodegenDB>;

export class WorkerDb {
  private static instance: Kysely<KyselyCodegenDB> | null = null;

  static async getInstance(env: Pick<Env, "SUPABASE_URI">): Promise<DB> {
    const pg = postgres(env.SUPABASE_URI);
    /**
     * The following line is to check if the connection is successful.
     */
    await pg.unsafe("SELECT 1");

    this.instance = new Kysely<KyselyCodegenDB>({
      dialect: new PostgresJSDialect({
        postgres: pg,
      }),
    });
    return this.instance;
  }

  static async close() {
    if (this.instance) {
      await this.instance.destroy();
    }
  }
}
