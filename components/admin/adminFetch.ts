/**
 * Fetch wrapper for the admin JSON API. Resolves with `data` on success and
 * throws an ApiError carrying a human message and any per-field errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {}
  ) {
    super(message);
  }
}

export async function adminFetch<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(rest.headers || {}) },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let body: { success?: boolean; data?: T; error?: string; fieldErrors?: Record<string, string> } = {};
  try {
    body = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (res.status === 401) {
    window.location.href = `/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    throw new ApiError('Your session has expired.', 401);
  }
  if (!res.ok || !body.success) {
    throw new ApiError(body.error || `Request failed (${res.status}).`, res.status, body.fieldErrors);
  }
  return body.data as T;
}
