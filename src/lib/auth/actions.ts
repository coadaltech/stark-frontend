"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, API_URL, authCookies, REFRESH_COOKIE, type TokenPair } from "./tokens";

export type LoginState = { error?: string; userName?: string };

/** Only redirect back to a page of this app after login. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const userName = String(formData.get("userName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!userName || !password) return { error: "Enter your username and password.", userName };

  let pair: TokenPair;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ UserName: userName, Password: password }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { error: body?.message ?? "Could not sign in. Please try again.", userName };
    }
    pair = (await res.json()) as TokenPair;
  } catch {
    return { error: "Could not reach the server. Please try again.", userName };
  }

  const store = await cookies();
  for (const c of authCookies(pair)) store.set(c.name, c.value, c.options);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // End the session on the server; sign out locally even if this fails.
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  redirect("/login");
}
