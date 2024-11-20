import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  LoaderFunctionArgs,
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { WorkerDb } from "lib/db";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/error-boundary.tsx";
import { CheckboxField, ErrorList, Field } from "~/components/forms.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { checkHoneypot, getHoneypot } from "~/utils/honeypot.server.ts";
import { useIsPending } from "~/utils/misc.ts";
import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
} from "~/utils/user-validation.ts";
import { getAuthSessionStorage } from "~/utils/session.server";
import { requireAnonymous, sessionKey, signup } from "~/utils/auth.server";
import { UserRepository } from "repositories/user";
import { safeRedirect } from "remix-utils/safe-redirect";

const SignupSchema = z.object({
  email: EmailSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  confirmPassword: PasswordSchema,
  agreeToTermsOfServiceAndPrivacyPolicy: z.boolean(),
  remember: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

export async function loader({ context, request }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  await requireAnonymous(
    getAuthSessionStorage(context.cloudflare.env),
    db,
    request
  );

  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);
  await requireAnonymous(
    getAuthSessionStorage(context.cloudflare.env),
    db,
    request
  );

  const formData = await request.formData();
  const honeypot = getHoneypot(context.cloudflare.env);
  checkHoneypot(honeypot, formData);

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
      const existingUserByUsername = await UserRepository.getUser(db, {
        username: data.username,
      });
      if (existingUserByUsername) {
        ctx.addIssue({
          path: ["username"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this username",
        });
        return;
      }
    }).transform(async (data) => {
      const { email, username, password } = data;
      const session = await signup(db, { email, username, password });
      return { ...data, session };
    }),
    async: true,
  });
  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { session, remember, redirectTo } = submission.value;

  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  authSession.set(sessionKey, session.id);
  const headers = new Headers();
  headers.append(
    "set-cookie",
    await authSessionStorage.commitSession(authSession, {
      expires: remember ? session.expires_at : undefined,
    })
  );

  return redirect(safeRedirect(redirectTo), {
    headers,
  });
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
          <Field
            labelProps={{
              htmlFor: fields.username.id,
              children: "Username",
            }}
            inputProps={{
              ...getInputProps(fields.username, { type: "text" }),
              autoComplete: "username",
            }}
            errors={fields.username.errors}
          />
          <Field
            labelProps={{
              htmlFor: fields.password.id,
              children: "Password",
            }}
            inputProps={{
              ...getInputProps(fields.password, { type: "password" }),
              autoComplete: "new-password",
            }}
            errors={fields.password.errors}
          />
          <Field
            labelProps={{
              htmlFor: fields.confirmPassword.id,
              children: "Confirm Password",
            }}
            inputProps={{
              ...getInputProps(fields.confirmPassword, { type: "password" }),
              autoComplete: "new-password",
            }}
            errors={fields.confirmPassword.errors}
          />
          <CheckboxField
            labelProps={{
              htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
              children:
                "Do you agree to our Terms of Service and Privacy Policy?",
            }}
            buttonProps={getInputProps(
              fields.agreeToTermsOfServiceAndPrivacyPolicy,
              { type: "checkbox" }
            )}
            errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
          />
          <CheckboxField
            labelProps={{
              htmlFor: fields.remember.id,
              children: "Remember me",
            }}
            buttonProps={getInputProps(fields.remember, {
              type: "checkbox",
            })}
            errors={fields.remember.errors}
          />
          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />
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
