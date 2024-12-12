import { type SerializeFrom } from "@remix-run/cloudflare";
import { useRouteLoaderData } from "@remix-run/react";
import { z } from "zod";
import { type loader as rootLoader } from "~/root.tsx";

// Temporary schema to make sure the user is a valid user
const userSchema = z.object({
  id: z.string(),
});

function isUser(
  user: unknown
): user is SerializeFrom<typeof rootLoader>["user"] {
  return userSchema.safeParse(user).success;
}

export function useOptionalUser() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  if (data && isUser(data.user)) return data.user;
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
