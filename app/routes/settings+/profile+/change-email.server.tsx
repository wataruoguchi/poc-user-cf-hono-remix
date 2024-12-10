import { invariant } from "@epic-web/invariant";
import * as E from "@react-email/components";
import { json, redirect } from "@remix-run/cloudflare";
import {
  requireRecentVerification,
  type VerifyFunctionArgs,
} from "../../../routes/_auth+/verify.server.ts";
import { sendEmail } from "../../../utils/email.server.ts";
import { getVerifySessionStorage } from "../../../utils/verification.server.ts";
import { newEmailAddressSessionKey } from "./change-email.tsx";
import { WorkerDB } from "lib/db.ts";
import { UserRepository } from "repositories/user.ts";

export async function handleVerification(
  env: Env,
  verifySessionStorage: ReturnType<typeof getVerifySessionStorage>,
  db: WorkerDB,
  { request, submission }: VerifyFunctionArgs
) {
  await requireRecentVerification(verifySessionStorage, db, request);
  invariant(
    submission.status === "success",
    "Submission should be successful by now"
  );

  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const newEmail = verifySession.get(newEmailAddressSessionKey);
  if (!newEmail) {
    return json(
      {
        result: submission.reply({
          formErrors: [
            "You must submit the code on the same device that requested the email change.",
          ],
        }),
      },
      { status: 400 }
    );
  }
  const preUpdateUser = await UserRepository.getUser(db, {
    id: submission.value.target,
  });
  invariant(preUpdateUser, "User not found");

  await UserRepository.updateEmail(db, submission.value.target, newEmail);

  void sendEmail(env, {
    to: preUpdateUser.email,
    subject: "Epic Stack email changed",
    react: <EmailChangeNoticeEmail userId={preUpdateUser.id} />,
  });

  return redirect("/settings/profile", {
    headers: {
      "set-cookie": await verifySessionStorage.destroySession(verifySession),
    },
  });
}

export function EmailChangeEmail({
  verifyUrl,
  otp,
}: {
  verifyUrl: string;
  otp: string;
}) {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <h1>
          <E.Text>Epic Notes Email Change</E.Text>
        </h1>
        <p>
          <E.Text>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
        </p>
        <p>
          <E.Text>Or click the link:</E.Text>
        </p>
        <E.Link href={verifyUrl}>{verifyUrl}</E.Link>
      </E.Container>
    </E.Html>
  );
}

function EmailChangeNoticeEmail({ userId }: { userId: string }) {
  return (
    <E.Html lang="en" dir="ltr">
      <E.Container>
        <h1>
          <E.Text>Your Epic Notes email has been changed</E.Text>
        </h1>
        <p>
          <E.Text>
            We&apos;re writing to let you know that your Epic Notes email has
            been changed.
          </E.Text>
        </p>
        <p>
          <E.Text>
            If you changed your email address, then you can safely ignore this.
            But if you did not change your email address, then please contact
            support immediately.
          </E.Text>
        </p>
        <p>
          <E.Text>Your Account ID: {userId}</E.Text>
        </p>
      </E.Container>
    </E.Html>
  );
}
