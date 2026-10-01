// Token and cookie handling shared by proxy.ts, the /api route handler and server code. Server-only.
// The frontend holds no JWT secret: the API is the only judge of a token (GET /auth/me).

export const ACCESS_COOKIE = "stark_access";
export const REFRESH_COOKIE = "stark_refresh";
/** The main app's site id in tokens; organization sites use their host. */
export const MAIN_SITE = "main";

/** Backend base URL — used from the Next server only. */
export const API_URL = process.env.API_URL ?? "http://localhost:8000";

/** Thrown when the API can't be reached or fails (5xx) — not the same as "signed out". */
export class ApiUnavailableError extends Error {
  constructor() {
    super("Could not reach the server.");
    this.name = "ApiUnavailableError";
  }
}

export type SessionUser = {
  loginId: number;
  userName: string;
  name: string;
  roleId: number;
  roleName: string;
  /** The account's organization — null for developers. */
  organizationId: number | null;
  /** "main" or the organization site's host. */
  site: string;
  /** The organization whose site this session is for — null on the main app. */
  siteOrganizationId: number | null;
};

export type TokenPair = {
  user: SessionUser;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
};

const REFRESH_MARGIN_SECONDS = 10;

/**
 * Whether the access token is missing, malformed or about to expire — only to decide *when* to refresh.
 * Reads `exp` without checking the signature, so it says nothing about whether the token is genuine.
 */
export function needsRefresh(token: string | undefined): boolean {
  const payload = token?.split(".")[1];
  if (!payload) return true;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof exp !== "number" || exp - REFRESH_MARGIN_SECONDS <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

async function post(path: string, body: unknown) {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiUnavailableError();
  }
}

/**
 * The user the API accepts `token` for (valid token, session active, site still there, account still
 * allowed on it), or null. Callers must also check the session is for the current site
 * (`sessionIsForSite`). Throws ApiUnavailableError if the API can't answer.
 */
export async function fetchSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    throw new ApiUnavailableError();
  }
  if (res.status >= 500) throw new ApiUnavailableError();
  if (!res.ok) return null;
  return (await res.json()) as SessionUser;
}

/**
 * Exchanges a refresh token for a new pair at the site of `host` (the API rotates it, and refuses a
 * token from another site); null if the session has ended. Throws ApiUnavailableError if the API
 * can't answer (keep the cookies then).
 */
export async function refreshTokens(refreshToken: string | undefined, host: string | null): Promise<TokenPair | null> {
  if (!refreshToken || !host) return null;
  const res = await post("/auth/refresh", { refreshToken, Host: host });
  if (res.status >= 500) throw new ApiUnavailableError();
  return res.ok ? ((await res.json()) as TokenPair) : null;
}

type CookieOptions = { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number };

// Host-only (no Domain attribute), httpOnly: never readable by browser JavaScript.
const baseCookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const secondsUntil = (epochSeconds: number) => Math.max(0, epochSeconds - Math.floor(Date.now() / 1000));

/** The cookies to store for a token pair. */
export function authCookies(pair: TokenPair): { name: string; value: string; options: CookieOptions }[] {
  return [
    { name: ACCESS_COOKIE, value: pair.accessToken, options: { ...baseCookie, maxAge: secondsUntil(pair.accessTokenExpiresAt) } },
    { name: REFRESH_COOKIE, value: pair.refreshToken, options: { ...baseCookie, maxAge: secondsUntil(pair.refreshTokenExpiresAt) } },
  ];
}
