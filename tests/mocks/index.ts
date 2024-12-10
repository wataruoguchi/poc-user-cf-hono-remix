import closeWithGrace from "close-with-grace";
import { setupServer } from "msw/node";
import { handlers as resendHandlers } from "./resend.ts";

export const server = setupServer(...resendHandlers);

server.listen({
  onUnhandledRequest(_request, print) {
    // // Do not print warnings on unhandled requests to https://<:userId>.ingest.us.sentry.io/api/
    // // Note: a request handler with passthrough is not suited with this type of url
    // //       until there is a more permissible url catching system
    // //       like requested at https://github.com/mswjs/msw/issues/1804
    // if (request.url.includes(".sentry.io")) {
    //   return;
    // }
    // Print the regular MSW unhandled request warning otherwise.
    print.warning();
  },
});

console.warn(
  `This is the mock server running on Node.js on ${process.env.NODE_ENV}`
);
// This is only for development, supposed to run on Node.js.
if (process.env.NODE_ENV !== "test") {
  console.info("🔶 Mock server installed");

  closeWithGrace(() => {
    server.close();
  });
}
