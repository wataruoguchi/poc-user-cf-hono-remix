import { redirect, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { WorkerDb } from "lib/db";
import { logout } from "~/utils/auth.server";
import { getAuthSessionStorage } from "~/utils/session.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  return logout(getAuthSessionStorage(context.cloudflare.env), db, { request });
}
