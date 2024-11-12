

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."kysely_migration" (
    "name" character varying(255) NOT NULL,
    "timestamp" character varying(255) NOT NULL
);


ALTER TABLE "public"."kysely_migration" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kysely_migration_lock" (
    "id" character varying(255) NOT NULL,
    "is_locked" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."kysely_migration_lock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."person" (
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."person" OWNER TO "postgres";


ALTER TABLE ONLY "public"."kysely_migration_lock"
    ADD CONSTRAINT "kysely_migration_lock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kysely_migration"
    ADD CONSTRAINT "kysely_migration_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."person"
    ADD CONSTRAINT "person_pkey" PRIMARY KEY ("id");



CREATE POLICY "Enable read access for all users" ON "public"."person" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users - service_role" ON "public"."person" FOR SELECT TO "service_role" USING (true);



ALTER TABLE "public"."kysely_migration" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kysely_migration_lock" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."person" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."kysely_migration" TO "anon";
GRANT ALL ON TABLE "public"."kysely_migration" TO "authenticated";
GRANT ALL ON TABLE "public"."kysely_migration" TO "service_role";



GRANT ALL ON TABLE "public"."kysely_migration_lock" TO "anon";
GRANT ALL ON TABLE "public"."kysely_migration_lock" TO "authenticated";
GRANT ALL ON TABLE "public"."kysely_migration_lock" TO "service_role";



GRANT ALL ON TABLE "public"."person" TO "anon";
GRANT ALL ON TABLE "public"."person" TO "authenticated";
GRANT ALL ON TABLE "public"."person" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
