import { requireUserWithPermission } from "~/utils/permissions.server.ts";
import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { WorkerDb } from "lib/db";
import { getAuthSessionStorage } from "~/utils/session.server";
import { UserRepository } from "repositories/user";
import { requireUserId } from "~/utils/auth.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);
  const isOwner =
    (await requireUserId(authSessionStorage, db, request)) ===
    (await UserRepository.getUser(db, { username: params.username! }))?.id;
  let canCreate: boolean;
  try {
    await requireUserWithPermission(
      authSessionStorage,
      db,
      request,
      `create:note:${isOwner ? "own" : "any"}`
    );
    canCreate = true;
  } catch (error) {
    canCreate = false;
  }
  let canRead: boolean;
  try {
    await requireUserWithPermission(
      authSessionStorage,
      db,
      request,
      `read:note:${isOwner ? "own" : "any"}`
    );
    canRead = true;
  } catch (error) {
    canRead = false;
  }
  let canUpdate: boolean;
  try {
    await requireUserWithPermission(
      authSessionStorage,
      db,
      request,
      `update:note:${isOwner ? "own" : "any"}`
    );
    canUpdate = true;
  } catch (error) {
    canUpdate = false;
  }
  let canDelete: boolean;
  try {
    await requireUserWithPermission(
      authSessionStorage,
      db,
      request,
      `delete:note:${isOwner ? "own" : "any"}`
    );
    canDelete = true;
  } catch (error) {
    canDelete = false;
  }

  return json({
    isOwner,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  });
}

export default function PermTestRoute() {
  const data = useLoaderData<typeof loader>();
  return <div>{JSON.stringify(data)}</div>;
}
