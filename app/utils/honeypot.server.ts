import { Honeypot, SpamError } from "remix-utils/honeypot/server";

export function getHoneypot(env: Env) {
  return new Honeypot({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    validFromFieldName: env.ENVIRONMENT === "test" ? null : undefined,
    encryptionSeed: env.HONEYPOT_SECRET,
  });
}

export function checkHoneypot(honeypot: Honeypot, formData: FormData) {
  try {
    honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response("Form not submitted properly", { status: 400 });
    }
    throw error;
  }
}
