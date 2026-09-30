/**
 * Browser calls go to this app's /api route, which adds the signed-in user's token (kept in an
 * httpOnly cookie) and forwards to the backend. Server code calls the backend directly and passes the
 * token itself.
 */
const isBrowser = typeof window !== "undefined";
const BASE_URL = isBrowser ? "/api" : (process.env.API_URL ?? "http://localhost:8000");

/** Error from the API; `fields` maps input names to messages for validation (422) errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiInit = RequestInit & {
  /** Access token — server code only; in the browser the /api route adds it. */
  token?: string;
};

export async function api<T>(path: string, { token, ...init }: ApiInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401 && isBrowser) {
      // The session has ended: sign in again, then come back to this page. A full page load (not the
      // router) so no signed-in client state survives; api() is a plain function, not a hook.
      const next = window.location.pathname + window.location.search;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    const body = (await res.json().catch(() => null)) as { message?: string; fields?: Record<string, string> } | null;
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status, body?.fields);
  }
  return res.json() as Promise<T>;
}
