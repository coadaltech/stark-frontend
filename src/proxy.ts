import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, authCookies, fetchSessionUser, needsRefresh, REFRESH_COOKIE, refreshTokens, type TokenPair } from "@/lib/auth/tokens";

const LOGIN_PATH = "/login";

/** A refreshed pair, null if the session has ended, or "unavailable" if the API can't answer. */
async function tryRefresh(request: NextRequest): Promise<TokenPair | null | "unavailable"> {
  try {
    return await refreshTokens(request.cookies.get(REFRESH_COOKIE)?.value);
  } catch {
    return "unavailable";
  }
}

function withCookies(response: NextResponse, pair: TokenPair) {
  for (const c of authCookies(pair)) response.cookies.set(c.name, c.value, c.options);
  return response;
}

function signedOut(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

/**
 * Runs before every page: keeps the session fresh and sends signed-out visitors to the login page.
 * Pages still confirm the session with the API (requireSession); this only decides when to refresh
 * (from the token's expiry time) and where to send the visitor.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;

  if (pathname === LOGIN_PATH) {
    // Ask the API here: a revoked or forged token must not bounce between "/" and "/login".
    const user = await fetchSessionUser(access).catch(() => null);
    if (user) return NextResponse.redirect(new URL("/", request.url));
    const pair = await tryRefresh(request);
    if (pair === "unavailable") return NextResponse.next();
    if (pair) return withCookies(NextResponse.redirect(new URL("/", request.url)), pair);
    return signedOut(NextResponse.next());
  }

  if (!needsRefresh(access)) return NextResponse.next();

  const pair = await tryRefresh(request);
  // API down: let the page render its "server unavailable" state; keep the cookies.
  if (pair === "unavailable") return NextResponse.next();
  if (pair) {
    // Let this request's render see the new access token too.
    for (const c of authCookies(pair)) request.cookies.set(c.name, c.value);
    return withCookies(NextResponse.next({ request: { headers: request.headers } }), pair);
  }

  const url = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return signedOut(NextResponse.redirect(url));
}

export const config = {
  // Everything except the /api proxy route (it handles its own auth), Next internals and static files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
