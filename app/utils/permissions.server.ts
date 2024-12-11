import { json } from "@remix-run/cloudflare";
import { WorkerDB } from "lib/db.ts";
import { UserRepository } from "repositories/user.ts";
import { requireUserId } from "./auth.server.ts";
import { AuthSessionStorage } from "./session.server.ts";

export type Action = "create" | "read" | "update" | "delete";
export type Entity = "user" | "note";
export type Access = "own" | "any" | "own,any" | "any,own";
export type PermissionString =
  | `${Action}:${Entity}`
  | `${Action}:${Entity}:${Access}`;

export async function requireUserWithPermission(
  authSessionStorage: AuthSessionStorage,
  db: WorkerDB,
  request: Request,
  permission: PermissionString
) {
  const userId = await requireUserId(authSessionStorage, db, request);
  const permissionData = parsePermissionString(permission);
  const user = await UserRepository.getUserWithPermissions(
    db,
    userId,
    permissionData
  );
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

export function parsePermissionString(permissionString: PermissionString) {
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
