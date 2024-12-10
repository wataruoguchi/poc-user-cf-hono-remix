create table "public"."password" (
    "hash" text not null,
    "person_id" uuid not null
);


create table "public"."permission" (
    "id" uuid not null,
    "action" text not null,
    "entity" text not null,
    "access" text not null,
    "description" text not null default ''::text,
    "created_at" timestamp without time zone not null default '2024-11-18 20:26:07.687131'::timestamp without time zone,
    "updated_at" timestamp without time zone not null default '2024-11-18 20:26:07.687131'::timestamp without time zone
);


create table "public"."role" (
    "id" uuid not null,
    "name" text not null,
    "description" text not null default ''::text,
    "created_at" timestamp without time zone not null default '2024-11-18 20:26:07.687131'::timestamp without time zone,
    "updated_at" timestamp without time zone not null default '2024-11-18 20:26:07.687131'::timestamp without time zone
);


create table "public"."role_permission" (
    "role_id" uuid not null,
    "permission_id" uuid not null
);


create table "public"."role_person" (
    "role_id" uuid not null,
    "person_id" uuid not null
);


create table "public"."session" (
    "id" uuid not null,
    "person_id" uuid not null,
    "expires_at" timestamp without time zone not null,
    "created_at" timestamp without time zone not null default '2024-11-19 18:20:33.287685'::timestamp without time zone,
    "updated_at" timestamp without time zone not null default '2024-11-19 18:20:33.287685'::timestamp without time zone
);


alter table "public"."person" alter column "created_at" set not null;

alter table "public"."person" alter column "email" set not null;

alter table "public"."person" alter column "updated_at" set not null;

alter table "public"."person" alter column "username" set not null;

CREATE UNIQUE INDEX password_person_id_unique ON public.password USING btree (person_id);

CREATE UNIQUE INDEX password_pk ON public.password USING btree (person_id);

CREATE UNIQUE INDEX permission_action_entity_unique ON public.permission USING btree (action, entity, access);

CREATE UNIQUE INDEX permission_pkey ON public.permission USING btree (id);

CREATE UNIQUE INDEX person_email_unique ON public.person USING btree (email);

CREATE UNIQUE INDEX person_username_unique ON public.person USING btree (username);

CREATE UNIQUE INDEX role_name_unique ON public.role USING btree (name);

CREATE UNIQUE INDEX role_permission_pk ON public.role_permission USING btree (role_id, permission_id);

CREATE UNIQUE INDEX role_person_pk ON public.role_person USING btree (role_id, person_id);

CREATE UNIQUE INDEX role_pkey ON public.role USING btree (id);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);

alter table "public"."password" add constraint "password_pk" PRIMARY KEY using index "password_pk";

alter table "public"."permission" add constraint "permission_pkey" PRIMARY KEY using index "permission_pkey";

alter table "public"."role" add constraint "role_pkey" PRIMARY KEY using index "role_pkey";

alter table "public"."role_permission" add constraint "role_permission_pk" PRIMARY KEY using index "role_permission_pk";

alter table "public"."role_person" add constraint "role_person_pk" PRIMARY KEY using index "role_person_pk";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."password" add constraint "password_person_id_fkey" FOREIGN KEY (person_id) REFERENCES person(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."password" validate constraint "password_person_id_fkey";

alter table "public"."password" add constraint "password_person_id_unique" UNIQUE using index "password_person_id_unique";

alter table "public"."permission" add constraint "permission_action_entity_unique" UNIQUE using index "permission_action_entity_unique";

alter table "public"."person" add constraint "person_email_unique" UNIQUE using index "person_email_unique";

alter table "public"."person" add constraint "person_username_unique" UNIQUE using index "person_username_unique";

alter table "public"."role" add constraint "role_name_unique" UNIQUE using index "role_name_unique";

alter table "public"."role_permission" add constraint "role_permission_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES permission(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_permission" validate constraint "role_permission_permission_id_fkey";

alter table "public"."role_permission" add constraint "role_permission_role_id_fkey" FOREIGN KEY (role_id) REFERENCES role(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_permission" validate constraint "role_permission_role_id_fkey";

alter table "public"."role_person" add constraint "role_person_person_id_fkey" FOREIGN KEY (person_id) REFERENCES person(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_person" validate constraint "role_person_person_id_fkey";

alter table "public"."role_person" add constraint "role_person_role_id_fkey" FOREIGN KEY (role_id) REFERENCES role(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_person" validate constraint "role_person_role_id_fkey";

alter table "public"."session" add constraint "session_person_id_fkey" FOREIGN KEY (person_id) REFERENCES person(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_person_id_fkey";

grant delete on table "public"."password" to "anon";

grant insert on table "public"."password" to "anon";

grant references on table "public"."password" to "anon";

grant select on table "public"."password" to "anon";

grant trigger on table "public"."password" to "anon";

grant truncate on table "public"."password" to "anon";

grant update on table "public"."password" to "anon";

grant delete on table "public"."password" to "authenticated";

grant insert on table "public"."password" to "authenticated";

grant references on table "public"."password" to "authenticated";

grant select on table "public"."password" to "authenticated";

grant trigger on table "public"."password" to "authenticated";

grant truncate on table "public"."password" to "authenticated";

grant update on table "public"."password" to "authenticated";

grant delete on table "public"."password" to "service_role";

grant insert on table "public"."password" to "service_role";

grant references on table "public"."password" to "service_role";

grant select on table "public"."password" to "service_role";

grant trigger on table "public"."password" to "service_role";

grant truncate on table "public"."password" to "service_role";

grant update on table "public"."password" to "service_role";

grant delete on table "public"."permission" to "anon";

grant insert on table "public"."permission" to "anon";

grant references on table "public"."permission" to "anon";

grant select on table "public"."permission" to "anon";

grant trigger on table "public"."permission" to "anon";

grant truncate on table "public"."permission" to "anon";

grant update on table "public"."permission" to "anon";

grant delete on table "public"."permission" to "authenticated";

grant insert on table "public"."permission" to "authenticated";

grant references on table "public"."permission" to "authenticated";

grant select on table "public"."permission" to "authenticated";

grant trigger on table "public"."permission" to "authenticated";

grant truncate on table "public"."permission" to "authenticated";

grant update on table "public"."permission" to "authenticated";

grant delete on table "public"."permission" to "service_role";

grant insert on table "public"."permission" to "service_role";

grant references on table "public"."permission" to "service_role";

grant select on table "public"."permission" to "service_role";

grant trigger on table "public"."permission" to "service_role";

grant truncate on table "public"."permission" to "service_role";

grant update on table "public"."permission" to "service_role";

grant delete on table "public"."role" to "anon";

grant insert on table "public"."role" to "anon";

grant references on table "public"."role" to "anon";

grant select on table "public"."role" to "anon";

grant trigger on table "public"."role" to "anon";

grant truncate on table "public"."role" to "anon";

grant update on table "public"."role" to "anon";

grant delete on table "public"."role" to "authenticated";

grant insert on table "public"."role" to "authenticated";

grant references on table "public"."role" to "authenticated";

grant select on table "public"."role" to "authenticated";

grant trigger on table "public"."role" to "authenticated";

grant truncate on table "public"."role" to "authenticated";

grant update on table "public"."role" to "authenticated";

grant delete on table "public"."role" to "service_role";

grant insert on table "public"."role" to "service_role";

grant references on table "public"."role" to "service_role";

grant select on table "public"."role" to "service_role";

grant trigger on table "public"."role" to "service_role";

grant truncate on table "public"."role" to "service_role";

grant update on table "public"."role" to "service_role";

grant delete on table "public"."role_permission" to "anon";

grant insert on table "public"."role_permission" to "anon";

grant references on table "public"."role_permission" to "anon";

grant select on table "public"."role_permission" to "anon";

grant trigger on table "public"."role_permission" to "anon";

grant truncate on table "public"."role_permission" to "anon";

grant update on table "public"."role_permission" to "anon";

grant delete on table "public"."role_permission" to "authenticated";

grant insert on table "public"."role_permission" to "authenticated";

grant references on table "public"."role_permission" to "authenticated";

grant select on table "public"."role_permission" to "authenticated";

grant trigger on table "public"."role_permission" to "authenticated";

grant truncate on table "public"."role_permission" to "authenticated";

grant update on table "public"."role_permission" to "authenticated";

grant delete on table "public"."role_permission" to "service_role";

grant insert on table "public"."role_permission" to "service_role";

grant references on table "public"."role_permission" to "service_role";

grant select on table "public"."role_permission" to "service_role";

grant trigger on table "public"."role_permission" to "service_role";

grant truncate on table "public"."role_permission" to "service_role";

grant update on table "public"."role_permission" to "service_role";

grant delete on table "public"."role_person" to "anon";

grant insert on table "public"."role_person" to "anon";

grant references on table "public"."role_person" to "anon";

grant select on table "public"."role_person" to "anon";

grant trigger on table "public"."role_person" to "anon";

grant truncate on table "public"."role_person" to "anon";

grant update on table "public"."role_person" to "anon";

grant delete on table "public"."role_person" to "authenticated";

grant insert on table "public"."role_person" to "authenticated";

grant references on table "public"."role_person" to "authenticated";

grant select on table "public"."role_person" to "authenticated";

grant trigger on table "public"."role_person" to "authenticated";

grant truncate on table "public"."role_person" to "authenticated";

grant update on table "public"."role_person" to "authenticated";

grant delete on table "public"."role_person" to "service_role";

grant insert on table "public"."role_person" to "service_role";

grant references on table "public"."role_person" to "service_role";

grant select on table "public"."role_person" to "service_role";

grant trigger on table "public"."role_person" to "service_role";

grant truncate on table "public"."role_person" to "service_role";

grant update on table "public"."role_person" to "service_role";

grant delete on table "public"."session" to "anon";

grant insert on table "public"."session" to "anon";

grant references on table "public"."session" to "anon";

grant select on table "public"."session" to "anon";

grant trigger on table "public"."session" to "anon";

grant truncate on table "public"."session" to "anon";

grant update on table "public"."session" to "anon";

grant delete on table "public"."session" to "authenticated";

grant insert on table "public"."session" to "authenticated";

grant references on table "public"."session" to "authenticated";

grant select on table "public"."session" to "authenticated";

grant trigger on table "public"."session" to "authenticated";

grant truncate on table "public"."session" to "authenticated";

grant update on table "public"."session" to "authenticated";

grant delete on table "public"."session" to "service_role";

grant insert on table "public"."session" to "service_role";

grant references on table "public"."session" to "service_role";

grant select on table "public"."session" to "service_role";

grant trigger on table "public"."session" to "service_role";

grant truncate on table "public"."session" to "service_role";

grant update on table "public"."session" to "service_role";


