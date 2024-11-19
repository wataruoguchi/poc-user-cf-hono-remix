import { json } from "@remix-run/cloudflare";
import { WorkerDB } from "lib/db.ts";
import { requireUserId } from "./auth.server.ts";
import { getAuthSessionStorage } from "./session.server.ts";

export type Action = "create" | "read" | "update" | "delete";
export type Entity = "user" | "note";
export type Access = "own" | "any" | "own,any" | "any,own";
export type PermissionString =
  | `${Action}:${Entity}`
  | `${Action}:${Entity}:${Access}`;

export async function requireUserWithPermission(
  authSessionStorage: ReturnType<typeof getAuthSessionStorage>,
  db: WorkerDB,
  request: Request,
  permission: PermissionString
) {
  const userId = await requireUserId(authSessionStorage, db, request);
  const permissionData = parsePermissionString(permission);
  const user = await db
    .selectFrom("person")
    .selectAll()
    .where("person.id", "=", userId)
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
  if (!user) {
    throw json(
      {
        error: "Unauthorized",
        requiredPermission: permissionData,
        message: `Unauthorized: required permissions: ${permission}`,
      },
      { status: 403 }
    );
  }
  return user.id;
}

function parsePermissionString(permissionString: PermissionString) {
  const [action, entity, access] = permissionString.split(":") as [
    Action,
    Entity,
    Access | undefined
  ];
  return {
    action,
    entity,
    access: access ? (access.split(",") as Array<Access>) : undefined,
  };
}
