import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, authCookies, fetchSessionUser, needsRefresh, REFRESH_COOKIE, refreshTokens, type TokenPair } from "@/lib/auth/tokens";
import { resolveSite, sessionIsForSite, type Site } from "@/lib/sites";

const LOGIN_PATH = "/login";
/** Internal routes for organization sites and site errors; only reachable through a rewrite. */
const SITE_PREFIX = "/site";

/** Serves the request: `next()` on the main app, a rewrite to internal routes on organization sites. */
type Forward = (init?: { request: { headers: Headers } }) => NextResponse;

/**
 * Runs before every page and /api call. Decides the site from the Host header (asking the API), then:
 * - main host → the main app;
 * - organization host → its internal /site/<orgId>/… routes;
 * - unknown host → "Site not found" (404).
 * On both kinds of site it keeps the session fresh and sends signed-out visitors to that site's login.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname === "/api" || pathname.startsWith("/api/");
  const host = request.headers.get("host");

  let site: Site | null;
  try {
    site = await resolveSite(host);
  } catch {
    return isApi
      ? NextResponse.json({ message: "Could not reach the server." }, { status: 502 })
      : NextResponse.rewrite(withPath(request, `${SITE_PREFIX}/unavailable`));
  }

  if (site?.kind === "main") {
    // Internal site routes don't exist on the main host.
    if (pathname === SITE_PREFIX || pathname.startsWith(`${SITE_PREFIX}/`)) {
      return NextResponse.rewrite(withPath(request, "/_not-found"));
    }
    // The /api route checks the session itself.
    if (isApi) return NextResponse.next();
    return sitePages(request, site, host, (init) => NextResponse.next(init));
  }

  if (!site) {
    return isApi
      ? NextResponse.json({ message: "Site not found" }, { status: 404 })
      : NextResponse.rewrite(withPath(request, `${SITE_PREFIX}/unknown`));
  }
  // Organization site: the /api route forwards with this site's session; the API decides what the
  // session may do (organization-site routes only).
  if (isApi) return NextResponse.next();
  const internal = withPath(request, `${SITE_PREFIX}/${site.organizationId}${pathname === "/" ? "" : pathname}`);
  return sitePages(request, site, host, (init) => NextResponse.rewrite(internal, init));
}

/** This request's URL with another path (query string kept). */
function withPath(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
}

/** A refreshed pair for this site, null if the session has ended, or "unavailable" if the API can't answer. */
async function tryRefresh(request: NextRequest, site: Site, host: string | null): Promise<TokenPair | null | "unavailable"> {
  try {
    const pair = await refreshTokens(request.cookies.get(REFRESH_COOKIE)?.value, host);
    return pair && sessionIsForSite(pair.user, site, host) ? pair : null;
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
 * Keeps the session fresh and sends signed-out visitors to the site's login page. Pages still confirm
 * the session with the API (requireSession); this only decides when to refresh (from the token's
 * expiry time) and where to send the visitor. Cookies are host-only, so each site has its own.
 */
async function sitePages(request: NextRequest, site: Site, host: string | null, forward: Forward) {
  const { pathname, search } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;

  if (pathname === LOGIN_PATH) {
    // Submitting the sign-in form (a server action): let it set the new cookies undisturbed.
    if (request.method !== "GET") return forward();
    // Ask the API here: a revoked or forged token must not bounce between "/" and "/login".
    const user = await fetchSessionUser(access).catch(() => null);
    if (user && sessionIsForSite(user, site, host)) return NextResponse.redirect(new URL("/", request.url));
    const pair = await tryRefresh(request, site, host);
    if (pair === "unavailable") return forward();
    if (pair) return withCookies(NextResponse.redirect(new URL("/", request.url)), pair);
    return signedOut(forward());
  }

  if (!needsRefresh(access)) return forward();

  const pair = await tryRefresh(request, site, host);
  // API down: let the page render its "server unavailable" state; keep the cookies.
  if (pair === "unavailable") return forward();
  if (pair) {
    // Let this request's render see the new access token too.
    for (const c of authCookies(pair)) request.cookies.set(c.name, c.value);
    return withCookies(forward({ request: { headers: request.headers } }), pair);
  }

  const url = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return signedOut(NextResponse.redirect(url));
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
