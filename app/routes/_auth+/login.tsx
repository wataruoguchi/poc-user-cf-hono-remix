import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { CheckboxField, ErrorList, Field } from "~/components/forms.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { checkHoneypot, getHoneypot } from "~/utils/honeypot.server.ts";
import { useIsPending } from "~/utils/misc.ts";
import { PasswordSchema, UsernameSchema } from "~/utils/user-validation.ts";
import { GeneralErrorBoundary } from "~/components/error-boundary.tsx";
import { Spacer } from "~/components/spacer.tsx";
import { login, requireAnonymous } from "~/utils/auth.server.ts";
import { handleNewSession } from "./login.server";
import { getAuthSessionStorage } from "~/utils/session.server";
import { WorkerDb } from "lib/db";

const LoginFormSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
  remember: z.boolean().optional(),
});

export async function loader({ context, request }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);

  await requireAnonymous(context.cloudflare.env, db, request);

  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);

  await requireAnonymous(context.cloudflare.env, db, request);

  const formData = await request.formData();
  checkHoneypot(getHoneypot(context.cloudflare.env), formData);

  const {
    cloudflare: { env },
  } = context;
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      LoginFormSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null };
        const session = await login(db, data);
        if (!session) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid username or password",
          });
          return z.NEVER;
        }
        return { ...data, session };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return json(
      { result: submission.reply({ hideFields: ["password"] }) },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { session, remember, redirectTo } = submission.value;
  return handleNewSession(getAuthSessionStorage(env), {
    request,
    session,
    remember: remember ?? false,
    redirectTo,
  });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(LoginFormSchema),
    defaultValue: { redirectTo },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome back!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>
        <Spacer size="xs" />
        <div>
          <div className="mx-auto w-full max-w-md px-8">
            <Form method="POST" {...getFormProps(form)}>
              <HoneypotInputs />
              <Field
                labelProps={{ children: "Username" }}
                inputProps={{
                  ...getInputProps(fields.username, { type: "text" }),
                  autoFocus: true,
                  className: "lowercase",
                  autoComplete: "username",
                }}
                errors={fields.username.errors}
              />

              <Field
                labelProps={{ children: "Password" }}
                inputProps={{
                  ...getInputProps(fields.password, {
                    type: "password",
                  }),
                  autoComplete: "current-password",
                }}
                errors={fields.password.errors}
              />

              <div className="flex justify-between">
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
                <div>
                  <Link
                    to="/forgot-password"
                    className="text-body-xs font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <input
                {...getInputProps(fields.redirectTo, { type: "hidden" })}
              />
              <ErrorList errors={form.errors} id={form.errorId} />

              <div className="flex items-center justify-between gap-6 pt-3">
                <StatusButton
                  className="w-full"
                  status={isPending ? "pending" : form.status ?? "idle"}
                  type="submit"
                  disabled={isPending}
                >
                  Log in
                </StatusButton>
              </div>
            </Form>
            <div className="flex items-center justify-center gap-2 pt-6">
              <span className="text-muted-foreground">New here?</span>
              <Link
                to={
                  redirectTo
                    ? `/signup?${encodeURIComponent(redirectTo)}`
                    : "/signup"
                }
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => {
  return [{ title: "Login to Epic Notes" }];
};

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
