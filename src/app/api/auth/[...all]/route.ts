import { toNextJsHandler } from "better-auth/next-js";

/* Auth loads on first request, so builds and the storefront work without the
 * auth env vars set; requests here fail until they are. */
const handler = () =>
  import("@/lib/auth/server").then(({ auth }) => toNextJsHandler(auth));

export async function GET(request: Request) {
  return (await handler()).GET(request);
}

export async function POST(request: Request) {
  return (await handler()).POST(request);
}
