import { createCookieSessionStorage } from "@remix-run/cloudflare";

export function getVerifySessionStorage(env: Env) {
  const verifySessionStorage = createCookieSessionStorage({
    cookie: {
      name: "en_verification",
      sameSite: "lax", // CSRF protection is advised if changing to 'none'
      path: "/",
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      secrets: env.SESSION_SECRET.split(","),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error // The auto-generated type is literal.
      secure: env.ENVIRONMENT === "production",
    },
  });

  return verifySessionStorage;
}
