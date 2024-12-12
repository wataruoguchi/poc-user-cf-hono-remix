import { type Submission } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { json } from "@remix-run/cloudflare";
import { DB, WorkerDb } from "lib/db.ts";
import { z } from "zod";
import { requireUserId } from "../../utils/auth.server.ts";
import { getDomainUrl } from "../../utils/misc.ts";
import { handleVerification as handleChangeEmailVerification } from "../settings+/profile+/change-email.server.tsx";
import { handleVerification as handleOnboardingVerification } from "./onboarding.server.ts";
// import { handleVerification as handleResetPasswordVerification } from "./reset-password.server.ts";
import { getVerifySessionStorage } from "~/utils/verification.server.ts";
import {
  codeQueryParam,
  redirectToQueryParam,
  targetQueryParam,
  typeQueryParam,
  VerifySchema,
  type VerificationTypes,
} from "./verify.tsx";

export type VerifyFunctionArgs = {
  request: Request;
  submission: Submission<
    z.input<typeof VerifySchema>,
    string[],
    z.output<typeof VerifySchema>
  >;
  body: FormData | URLSearchParams;
};

export function getRedirectToUrl({
  request,
  type,
  target,
  redirectTo,
}: {
  request: Request;
  type: VerificationTypes;
  target: string;
  redirectTo?: string;
}) {
  const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`);
  redirectToUrl.searchParams.set(typeQueryParam, type);
  redirectToUrl.searchParams.set(targetQueryParam, target);
  if (redirectTo) {
    redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo);
  }
  return redirectToUrl;
}

export async function requireRecentVerification(
  env: Env,
  db: DB,
  request: Request
) {
  const userId = await requireUserId(env, db, request);
  console.log({ userId });
}

export async function isCodeValid({
  code,
  type,
  target,
}: {
  code: string;
  type: VerificationTypes;
  target: string;
}) {
  console.log({ code, type, target });
  return true;
}

export async function validateRequest(
  env: Env,
  request: Request,
  body: URLSearchParams | FormData
) {
  const submission = await parseWithZod(body, {
    schema: VerifySchema.superRefine(async (data, ctx) => {
      const codeIsValid = await isCodeValid({
        code: data[codeQueryParam],
        type: data[typeQueryParam],
        target: data[targetQueryParam],
      });
      if (!codeIsValid) {
        ctx.addIssue({
          path: ["code"],
          code: z.ZodIssueCode.custom,
          message: `Invalid code`,
        });
        return;
      }
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { value: submissionValue } = submission;

  const db = await WorkerDb.getInstance(env);

  async function deleteVerification() {
    // await prisma.verification.delete({
    //   where: {
    //     target_type: {
    //       type: submissionValue[typeQueryParam],
    //       target: submissionValue[targetQueryParam],
    //     },
    //   },
    // });
  }

  switch (submissionValue[typeQueryParam]) {
    // case "reset-password": {
    //   await deleteVerification();
    //   return handleResetPasswordVerification({ request, body, submission });
    // }
    case "onboarding": {
      await deleteVerification();
      return handleOnboardingVerification(env, { request, body, submission });
    }
    case "change-email": {
      await deleteVerification();
      return handleChangeEmailVerification(
        env,
        getVerifySessionStorage(env),
        db,
        { request, body, submission }
      );
    }
    // case "2fa": {
    //   return handleLoginTwoFactorVerification({ request, body, submission });
    // }
  }
}
