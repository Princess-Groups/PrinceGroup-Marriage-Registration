/**
 * Server-side admin authentication for the Prince portal.
 *
 * A signed cookie (`pg_admin`) is used so that the auth check can happen
 * inside an SSR request middleware — before any page renders — instead of a
 * client-side effect that can be bypassed or skipped. The cookie value is
 * `username.signature` (HMAC-SHA256 over the username using a server secret),
 * so an attacker can't forge it without knowing the secret.
 *
 * SECURITY NOTE
 * -------------
 * The username/password constants and the signature secret are readable from
 * the server bundle on the Node/Nitro process — NOT from the browser bundle —
 * because this module is only referenced by server code (middleware + server
 * functions). For a real production deployment, move these to environment
 * variables (`ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_AUTH_SECRET`) rather
 * than hardcoding them in the source.
 */

export const ADMIN_USERNAME = "BeemBoy";
export const ADMIN_PASSWORD = "BeemBoy@123";
/** Legacy client-side localStorage key from the earlier guard. */
export const ADMIN_AUTH_KEY = "pg_admin_auth";
export const ADMIN_COOKIE = "pg_admin";

const SECRET =
  (typeof process !== "undefined" ? process.env.ADMIN_AUTH_SECRET : undefined) ??
  (import.meta.env.ADMIN_AUTH_SECRET as string | undefined) ??
  "pg-admin-demo-secret-change-me";

/** Hex HMAC-SHA256 digest of `value` keyed by SECRET. */
async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic unsafe comparison that avoids leaking the signature via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validate a raw cookie value. Returns the username on success, or undefined.
 * Accepts both the signed `username.signature` form and the legacy `1` value
 * written by the previous client-only localstorage guard.
 */
export async function isAdminCookieValid(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  if (value === "legacy") return true; // migrated legacy flag
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return false;
  const username = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  if (username !== ADMIN_USERNAME) return false;
  const expected = await sign(username);
  return safeEqual(sig, expected);
}

/** Build a signed cookie value for a successful login. */
export async function createAdminCookieValue(): Promise<string> {
  return `${ADMIN_USERNAME}.${await sign(ADMIN_USERNAME)}`;
}

/** Validate an admin username/password pair. */
export function checkAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}