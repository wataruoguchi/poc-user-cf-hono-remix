import { type SerializeFrom } from "@remix-run/cloudflare";
import { useRouteLoaderData } from "@remix-run/react";
import { type loader as rootLoader } from "~/root.tsx";

function isUser(
  user: unknown
): user is SerializeFrom<typeof rootLoader>["user"] {
  return !!(
    user &&
    typeof user === "object" &&
    "id" in user &&
    typeof user.id === "string"
  );
}

export function useOptionalUser() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser() {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}
