import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, type AdminSession } from '@/lib/auth';

/**
 * Small helpers shared by the JSON API routes so every route answers the same
 * shape: `{ success: true, data }` or `{ error, fieldErrors? }`. Internal error
 * details are logged on the server and never sent to the browser.
 */

export type FieldErrors = Record<string, string>;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, status = 400, fieldErrors?: FieldErrors) {
  return NextResponse.json({ error, ...(fieldErrors ? { fieldErrors } : {}) }, { status });
}

/** Returns the session, or a 401 response to return as-is. */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getSession();
  return session ?? fail('Your session has expired. Sign in again.', 401);
}

export function zodFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Parse a JSON body against a schema; returns data or a 400 response. */
export async function parseJson<S extends z.ZodTypeAny>(
  request: Request,
  schema: S
): Promise<{ data: z.infer<S> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: fail('The request body is not valid JSON.') };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { response: fail('Some fields need attention.', 400, zodFieldErrors(parsed.error)) };
  }
  return { data: parsed.data };
}

export function serverError(context: string, err: unknown) {
  console.error(`[api] ${context}:`, err);
  return fail('Something went wrong on our side. Please try again.', 500);
}
