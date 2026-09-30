import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, fetchSessionUser, type SessionUser } from "./tokens";

/**
 * The signed-in user for this request, as confirmed by the API (GET /auth/me — one call per request,
 * shared by the layout and page), or null. proxy.ts refreshes an expired access token before the page
 * renders. Throws ApiUnavailableError if the API can't answer.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  return fetchSessionUser((await cookies()).get(ACCESS_COOKIE)?.value);
});

/** For layouts and pages: the signed-in user, or a redirect to the login page. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/** The access token to forward to the API from server code. */
export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}
