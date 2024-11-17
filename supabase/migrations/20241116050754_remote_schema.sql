alter table "public"."person" add column "created_at" timestamp without time zone default '2024-11-16 05:06:38.136476'::timestamp without time zone;

alter table "public"."person" add column "email" text;

alter table "public"."person" add column "updated_at" timestamp without time zone default '2024-11-16 05:06:38.136476'::timestamp without time zone;

alter table "public"."person" add column "username" text;


