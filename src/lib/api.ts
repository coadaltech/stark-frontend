export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string; fields?: Record<string, string> } | null;
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status, body?.fields);
  }
  return res.json() as Promise<T>;
}
