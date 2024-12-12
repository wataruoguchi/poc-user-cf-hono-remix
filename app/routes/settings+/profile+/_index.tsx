import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/forms.tsx";
import { Icon } from "~/components/ui/icon.tsx";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { requireUserId } from "~/utils/auth.server.ts";
import { WorkerDB, WorkerDb } from "lib/db.ts";
import { useDoubleCheck } from "~/utils/misc.ts";
import {
  AuthSessionStorage,
  getAuthSessionStorage,
} from "~/utils/session.server.ts";
import { NameSchema, UsernameSchema } from "~/utils/user-validation.ts";
import { UserRepository } from "repositories/user";

const ProfileFormSchema = z.object({
  name: NameSchema.optional(),
  username: UsernameSchema,
});

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);

  const userId = await requireUserId(context.cloudflare.env, db, request);
  const user = await UserRepository.getUser(db, { id: userId });
  if (!user) invariantResponse(user, "User not found", { status: 404 });

  return json({
    user,
    hasPassword: Boolean(
      await UserRepository.getPasswordHash(db, { id: userId })
    ),
  });
}

type ProfileActionArgs = {
  db: WorkerDB;
  authSessionStorage: AuthSessionStorage;
  request: Request;
  userId: string;
  formData: FormData;
};
const profileUpdateActionIntent = "update-profile";
const deleteDataActionIntent = "delete-data";

export async function action({ request, context }: ActionFunctionArgs) {
  const db = await WorkerDb.getInstance(context.cloudflare.env);
  const authSessionStorage = getAuthSessionStorage(context.cloudflare.env);

  const userId = await requireUserId(context.cloudflare.env, db, request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  switch (intent) {
    case profileUpdateActionIntent: {
      return profileUpdateAction({
        db,
        authSessionStorage,
        request,
        userId,
        formData,
      });
    }
    case deleteDataActionIntent: {
      return deleteDataAction({
        db,
        authSessionStorage,
        request,
        userId,
        formData,
      });
    }
    default: {
      throw new Response(`Invalid intent "${intent}"`, { status: 400 });
    }
  }
}

export default function EditUserProfile() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-12">
      <UpdateProfile />

      <div className="col-span-6 my-6 h-1 border-b-[1.5px] border-foreground" />
      <div className="col-span-full flex flex-col gap-6">
        <div>
          <Link to="change-email">
            <Icon name="envelope-closed">
              Change email from {data.user.email}
            </Icon>
          </Link>
        </div>
        <div>
          <Link to={data.hasPassword ? "password" : "password/create"}>
            <Icon name="dots-horizontal">
              {data.hasPassword ? "Change Password" : "Create a Password"}
            </Icon>
          </Link>
        </div>
        <div>
          <Link to="connections">
            <Icon name="link-2">Manage connections</Icon>
          </Link>
        </div>
        <div>
          <Link
            reloadDocument
            download="my-epic-notes-data.json"
            to="/resources/download-user-data"
          >
            <Icon name="download">Download your data</Icon>
          </Link>
        </div>
        <DeleteData />
      </div>
    </div>
  );
}

async function profileUpdateAction({
  db,
  userId,
  formData,
}: ProfileActionArgs) {
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ProfileFormSchema.superRefine(async ({ username }, ctx) => {
      const existingUsername = await UserRepository.getUser(db, {
        username,
      });

      if (existingUsername && existingUsername.id !== userId) {
        ctx.addIssue({
          path: ["username"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this username",
        });
      }
    }),
  });
  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const data = submission.value;

  await UserRepository.updateUsername(db, userId, data.username);

  return json({
    result: submission.reply(),
  });
}

function UpdateProfile() {
  const data = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof profileUpdateAction>();

  const [form, fields] = useForm({
    id: "edit-profile",
    constraint: getZodConstraint(ProfileFormSchema),
    lastResult: fetcher.data?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ProfileFormSchema });
    },
    defaultValue: {
      username: data.user.username,
    },
  });

  return (
    <fetcher.Form method="POST" {...getFormProps(form)}>
      <div className="grid grid-cols-6 gap-x-10">
        <Field
          className="col-span-3"
          labelProps={{
            htmlFor: fields.username.id,
            children: "Username",
          }}
          inputProps={getInputProps(fields.username, { type: "text" })}
          errors={fields.username.errors}
        />
      </div>
      <ErrorList errors={form.errors} id={form.errorId} />

      <div className="mt-8 flex justify-center">
        <StatusButton
          type="submit"
          size="wide"
          name="intent"
          value={profileUpdateActionIntent}
          status={fetcher.state !== "idle" ? "pending" : form.status ?? "idle"}
        >
          Save changes
        </StatusButton>
      </div>
    </fetcher.Form>
  );
}

async function deleteDataAction({
  db,
  authSessionStorage,
  request,
  userId,
}: ProfileActionArgs) {
  await UserRepository.deleteUser(db, userId);
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  await authSessionStorage.destroySession(authSession);
  return redirect("/", {
    status: 302,
  });
}

function DeleteData() {
  const dc = useDoubleCheck();

  const fetcher = useFetcher<typeof deleteDataAction>();
  return (
    <div>
      <fetcher.Form method="POST">
        <StatusButton
          {...dc.getButtonProps({
            type: "submit",
            name: "intent",
            value: deleteDataActionIntent,
          })}
          variant={dc.doubleCheck ? "destructive" : "default"}
          status={fetcher.state !== "idle" ? "pending" : "idle"}
        >
          <Icon name="trash">
            {dc.doubleCheck ? `Are you sure?` : `Delete all your data`}
          </Icon>
        </StatusButton>
      </fetcher.Form>
    </div>
  );
}
