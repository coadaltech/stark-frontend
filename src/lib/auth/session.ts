import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHost, getSite, sessionIsForSite } from "@/lib/sites";
import { ACCESS_COOKIE, fetchSessionUser, type SessionUser } from "./tokens";

/**
 * The signed-in user for this request, as confirmed by the API (GET /auth/me — one call per request,
 * shared by the layout and page), or null. Only a session for the current site counts. proxy.ts
 * refreshes an expired access token before the page renders. Throws ApiUnavailableError if the API
 * can't answer.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const [user, site, host] = await Promise.all([
    fetchSessionUser((await cookies()).get(ACCESS_COOKIE)?.value),
    getSite(),
    getHost(),
  ]);
  return user && site && sessionIsForSite(user, site, host) ? user : null;
});

/** For layouts and pages: the signed-in user, or a redirect to this site's login page. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/** The access token to forward to the API from server code. */
export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}
