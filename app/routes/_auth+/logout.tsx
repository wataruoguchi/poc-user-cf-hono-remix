import { redirect, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/utils/auth.server";
import { getAuthSessionStorage } from "~/utils/session.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request, context }: ActionFunctionArgs) {
  return logout(getAuthSessionStorage(context.cloudflare.env), { request });
}
