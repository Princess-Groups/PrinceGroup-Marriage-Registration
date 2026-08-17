import { createStart, createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { ADMIN_COOKIE, isAdminCookieValid } from "./lib/admin-auth";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Server-side auth guard for the admin area.
 *
 * Runs for every router (page) request. If the path is under /admin (but not
 * the login page itself) and there is no valid auth cookie, short-circuit the
 * request with a 302 redirect to /admin/login. This runs before React renders,
 * so an unauthenticated visitor can never see the dashboard HTML at all —
 * even with client-side JavaScript disabled or stripped.
 *
 * Server-function (RPC) requests are skipped: the server functions perform
 * their own credential checks (see adminLogin / adminLogout).
 */
const adminAuthMiddleware = createMiddleware().server(async ({ request, pathname, handlerType, next }) => {
  if (handlerType === "serverFn") return await next();

  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminPath) return await next();

  // The login page itself is always reachable.
  if (pathname === "/admin/login") return await next();

  const cookie = getCookie(ADMIN_COOKIE);
  const ok = await isAdminCookieValid(cookie);
  if (ok) return await next();

  const loginUrl = new URL("/admin/login", request.url);
  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl.href },
  });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, adminAuthMiddleware],
}));
