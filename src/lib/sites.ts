// Which site a request is for, decided by the API from the Host header (spec §5.3). Server-only.
import { cache } from "react";
import { headers } from "next/headers";
import { API_URL, ApiUnavailableError } from "@/lib/auth/tokens";

export type Site = { kind: "main" } | { kind: "organization"; organizationId: number; name: string };

/** The site `host` belongs to, or null ("Site not found"). Throws ApiUnavailableError if the API can't answer. */
export async function resolveSite(host: string | null): Promise<Site | null> {
  if (!host) return null;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/sites/resolve?host=${encodeURIComponent(host)}`, { cache: "no-store" });
  } catch {
    throw new ApiUnavailableError();
  }
  if (res.status >= 500) throw new ApiUnavailableError();
  return res.ok ? ((await res.json()) as Site) : null;
}

/** The current request's site (one API call per request, shared by layouts and pages). */
export const getSite = cache(async () => resolveSite((await headers()).get("host")));
