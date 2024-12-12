import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { CheckboxField, ErrorList, Field } from "~/components/forms.tsx";
import { Spacer } from "~/components/spacer.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { requireAnonymous, sessionKey, signup } from "~/utils/auth.server";
import { checkHoneypot, getHoneypot } from "~/utils/honeypot.server";
import { useIsPending } from "~/utils/misc.ts";
import { getAuthSessionStorage } from "~/utils/session.server";
import {
  NameSchema,
  PasswordAndConfirmPasswordSchema,
  UsernameSchema,
} from "~/utils/user-validation";
import { getVerifySessionStorage } from "~/utils/verification.server";
import { WorkerDb, DB } from "../../../lib/db";
import { UserRepository } from "repositories/user";

export const onboardingEmailSessionKey = "onboardingEmail";

const SignupFormSchema = z
  .object({
    username: UsernameSchema,
    name: NameSchema,
    agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
      required_error:
        "You must agree to the terms of service and privacy policy",
    }),
    remember: z.boolean().optional(),
    redirectTo: z.string().optional(),
  })
  .and(PasswordAndConfirmPasswordSchema);

async function requireOnboardingEmail(env: Env, db: DB, request: Request) {
  await requireAnonymous(env, db, request);
  const verifySession = await getVerifySessionStorage(env).getSession(
    request.headers.get("cookie")
  );
  const email = verifySession.get(onboardingEmailSessionKey);
  if (typeof email !== "string" || !email) {
    throw redirect("/signup");
  }
  return email;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);

  const email = await requireOnboardingEmail(
    context.cloudflare.env,
    db,
    request
  );
  return json({ email });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);

  const email = await requireOnboardingEmail(
    context.cloudflare.env,
    db,
    request
  );
  const formData = await request.formData();
  checkHoneypot(getHoneypot(context.cloudflare.env), formData);

  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      SignupFormSchema.superRefine(async (data, ctx) => {
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
        if (intent !== null) return { ...data, session: null };
        const session = await signup(db, { ...data, email });
        return { ...data, session };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { session, remember, redirectTo } = submission.value;

  const authSession = await getAuthSessionStorage(
    context.cloudflare.env
  ).getSession(request.headers.get("cookie"));
  authSession.set(sessionKey, session.id);
  const verifySession = await getVerifySessionStorage(
    context.cloudflare.env
  ).getSession();
  const headers = new Headers();
  headers.append(
    "set-cookie",
    await getAuthSessionStorage(context.cloudflare.env).commitSession(
      authSession,
      {
        expires: remember ? session.expires_at : undefined,
      }
    )
  );
  headers.append(
    "set-cookie",
    await getVerifySessionStorage(context.cloudflare.env).destroySession(
      verifySession
    )
  );

  return redirect(safeRedirect(redirectTo), { headers });
}

export const meta: MetaFunction = () => {
  return [{ title: "Setup Epic Notes Account" }];
};

export default function OnboardingRoute() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "onboarding-form",
    constraint: getZodConstraint(SignupFormSchema),
    defaultValue: { redirectTo },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome aboard {data.email}!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>
        <Spacer size="xs" />
        <Form
          method="POST"
          className="mx-auto min-w-full max-w-sm sm:min-w-[368px]"
          {...getFormProps(form)}
        >
          <HoneypotInputs />
          <Field
            labelProps={{ htmlFor: fields.username.id, children: "Username" }}
            inputProps={{
              ...getInputProps(fields.username, { type: "text" }),
              autoComplete: "username",
              className: "lowercase",
            }}
            errors={fields.username.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.name.id, children: "Name" }}
            inputProps={{
              ...getInputProps(fields.name, { type: "text" }),
              autoComplete: "name",
            }}
            errors={fields.name.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.password.id, children: "Password" }}
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
            buttonProps={getInputProps(fields.remember, { type: "checkbox" })}
            errors={fields.remember.errors}
          />

          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex items-center justify-between gap-6">
            <StatusButton
              className="w-full"
              status={isPending ? "pending" : form.status ?? "idle"}
              type="submit"
              disabled={isPending}
            >
              Create an account
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
