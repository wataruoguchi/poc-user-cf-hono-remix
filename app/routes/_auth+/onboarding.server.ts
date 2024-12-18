import { invariant } from "@epic-web/invariant";
import { redirect } from "@remix-run/cloudflare";
import { getVerifySessionStorage } from "../../utils/verification.server.ts";
import { onboardingEmailSessionKey } from "./onboarding.tsx";
import { type VerifyFunctionArgs } from "./verify.server.ts";

export async function handleVerification(
  env: Env,
  { submission }: VerifyFunctionArgs
) {
  invariant(
    submission.status === "success",
    "Submission should be successful by now"
  );
  const verifySessionStorage = getVerifySessionStorage(env);
  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(onboardingEmailSessionKey, submission.value.target);
  return redirect("/onboarding", {
    headers: {
      "set-cookie": await verifySessionStorage.commitSession(verifySession),
    },
  });
}
