import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/forms.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { requireRecentVerification } from "~/routes/_auth+/verify.server.ts";
import { requireUserId } from "~/utils/auth.server.ts";
import { WorkerDb } from "lib/db.ts";
// import { sendEmail } from "~/utils/email.server.ts";
import { useIsPending } from "~/utils/misc.ts";
import { EmailSchema } from "~/utils/user-validation.ts";
import { getVerifySessionStorage } from "~/utils/verification.server.ts";
// import { EmailChangeEmail } from "./change-email.server.tsx";
import { UserRepository } from "repositories/user.ts";
import { getAuthSessionStorage } from "~/utils/session.server.ts";

export const newEmailAddressSessionKey = "new-email-address";

const ChangeEmailSchema = z.object({
  email: EmailSchema,
});

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);
  await requireRecentVerification(
    getVerifySessionStorage(context.cloudflare.env),
    db,
    request
  );
  const userId = await requireUserId(authSessionStorage, db, request);
  const user = await UserRepository.getUser(db, {
    id: userId,
  });
  if (!user) {
    const params = new URLSearchParams({ redirectTo: request.url });
    throw redirect(`/login?${params}`);
  }
  return json({ user });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  // const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);
  // const userId = await requireUserId(authSessionStorage, db, request);
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
      const existingUser = await UserRepository.getUser(db, {
        email: data.email,
      });
      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "This email is already in use.",
        });
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
  //   const { otp, redirectTo, verifyUrl } = await prepareVerification({
  //     period: 10 * 60,
  //     request,
  //     target: userId,
  //     type: "change-email",
  //   });

  //   const response = await sendEmail(context.cloudflare.env, {
  //     to: submission.value.email,
  //     subject: `Epic Notes Email Change Verification`,
  //     react: <EmailChangeEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
  //   });

  //   if (response.status === "success") {
  //     const verifySessionStorage = getVerifySessionStorage(
  //       context.cloudflare.env
  //     );
  //     const verifySession = await verifySessionStorage.getSession();
  //     verifySession.set(newEmailAddressSessionKey, submission.value.email);
  //     return redirect(redirectTo.toString(), {
  //       headers: {
  //         "set-cookie": await verifySessionStorage.commitSession(verifySession),
  //       },
  //     });
  //   } else {
  //     return json(
  //       { result: submission.reply({ formErrors: [response.error.message] }) },
  //       { status: 500 }
  //     );
  //   }
}

export default function ChangeEmailIndex() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    id: "change-email-form",
    constraint: getZodConstraint(ChangeEmailSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangeEmailSchema });
    },
  });

  const isPending = useIsPending();
  return (
    <div>
      <h1 className="text-h1">Change Email</h1>
      <p>You will receive an email at the new email address to confirm.</p>
      <p>
        An email notice will also be sent to your old address {data.user.email}.
      </p>
      <div className="mx-auto mt-5 max-w-sm">
        <Form method="POST" {...getFormProps(form)}>
          <Field
            labelProps={{ children: "New Email" }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoComplete: "email",
            }}
            errors={fields.email.errors}
          />
          <ErrorList id={form.errorId} errors={form.errors} />
          <div>
            <StatusButton
              status={isPending ? "pending" : form.status ?? "idle"}
            >
              Send Confirmation
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
