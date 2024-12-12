import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { WorkerDb } from "lib/db";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/error-boundary.tsx";
import { ErrorList, Field } from "~/components/forms.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { checkHoneypot, getHoneypot } from "~/utils/honeypot.server.ts";
import { useIsPending } from "~/utils/misc.ts";
import { EmailSchema } from "~/utils/user-validation.ts";
import { requireAnonymous } from "~/utils/auth.server";
import { UserRepository } from "repositories/user";
import { sendEmail } from "~/utils/email.server";
import { getVerifySessionStorage } from "~/utils/verification.server";
import { onboardingEmailSessionKey } from "./onboarding";

const SignupSchema = z.object({
  email: EmailSchema,
});

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  await requireAnonymous(context.cloudflare.env, db, request);

  const formData = await request.formData();
  checkHoneypot(getHoneypot(context.cloudflare.env), formData);

  const submission = await parseWithZod(formData, {
    schema: SignupSchema.superRefine(async (data, ctx) => {
      const existingUserByEmail = await UserRepository.getUser(db, {
        email: data.email,
      });
      if (existingUserByEmail) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this email",
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
  const { email } = submission.value;

  const response = await sendEmail(context.cloudflare.env, {
    to: email,
    subject: "Welcome to Epic Notes!",
    react: <div>Welcome to Epic Notes!</div>,
  });
  if (response.status === "success") {
    const verifySessionStorage = getVerifySessionStorage(
      context.cloudflare.env
    );
    const verifySession = await verifySessionStorage.getSession(
      request.headers.get("cookie")
    );
    verifySession.set(onboardingEmailSessionKey, email);
    return redirect("/onboarding", {
      headers: {
        "set-cookie": await verifySessionStorage.commitSession(verifySession),
      },
    });
  } else {
    return json(
      {
        result: submission.reply({ formErrors: [response.error.message] }),
      },
      {
        status: 500,
      }
    );
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Sign Up | Epic Notes" }];
};

export default function SignupRoute() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "signup-form",
    constraint: getZodConstraint(SignupSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SignupSchema });
      return result;
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex flex-col justify-center pb-32 pt-20">
      <div className="text-center">
        <h1 className="text-h1">Let&apos;s start your journey!</h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          Please enter your email.
        </p>
      </div>
      <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-[368px]">
        <Form method="POST" {...getFormProps(form)}>
          <HoneypotInputs />
          <Field
            labelProps={{
              htmlFor: fields.email.id,
              children: "Email",
            }}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoFocus: true,
              autoComplete: "email",
            }}
            errors={fields.email.errors}
          />
          <ErrorList errors={form.errors} id={form.errorId} />
          <StatusButton
            className="w-full"
            status={isPending ? "pending" : form.status ?? "idle"}
            type="submit"
            disabled={isPending}
          >
            Submit
          </StatusButton>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
