import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, API_URL, authCookies, needsRefresh, REFRESH_COOKIE, refreshTokens } from "@/lib/auth/tokens";

const unavailable = () => NextResponse.json({ message: "Could not reach the server." }, { status: 502 });

/**
 * Forwards browser requests (/api/...) to the backend with the signed-in user's access token, which
 * lives in an httpOnly cookie the browser can't read. The API judges the token; this route refreshes
 * it when it's about to expire, or once when the API rejects it — always at this request's site (Host),
 * so a token is only ever refreshed where it was issued.
 */
async function forward(request: NextRequest, { params }: RouteContext<"/api/[...path]">) {
  const { path } = await params;
  // Sign-in/out only happen through server actions, never through this proxy.
  if (path[0] === "auth") return NextResponse.json({ message: "Not found" }, { status: 404 });

  const store = await cookies();
  /** Refreshes the pair and stores it; the new access token, or null if the session has ended. */
  const refresh = async () => {
    const pair = await refreshTokens(store.get(REFRESH_COOKIE)?.value, request.headers.get("host"));
    if (!pair) {
      store.delete(ACCESS_COOKIE);
      store.delete(REFRESH_COOKIE);
      return null;
    }
    for (const c of authCookies(pair)) store.set(c.name, c.value, c.options);
    return pair.accessToken;
  };

  const target = `${API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const contentType = request.headers.get("content-type");
  const send = (token: string) =>
    fetch(target, {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, ...(contentType ? { "Content-Type": contentType } : {}) },
      body,
      cache: "no-store",
    });

  try {
    let token = store.get(ACCESS_COOKIE)?.value;
    let refreshed = false;
    if (!token || needsRefresh(token)) {
      token = (await refresh()) ?? undefined;
      refreshed = true;
    }
    if (!token) return NextResponse.json({ message: "Please sign in again." }, { status: 401 });

    let upstream = await send(token);
    if (upstream.status === 401 && !refreshed) {
      // Rejected before its expiry (e.g. a damaged cookie): one refresh, one retry.
      const fresh = await refresh();
      if (!fresh) return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
      upstream = await send(fresh);
    }

    return new NextResponse(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return unavailable();
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
