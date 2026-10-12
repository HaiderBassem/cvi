import { createContactMessage } from '@/lib/db';
import { ContactSchema } from '@/lib/validation/schemas';
import { fail, ok, parseJson, serverError } from '@/lib/http/api';
import { clientIp, rateLimit } from '@/lib/http/rateLimit';

/** Public: the contact form posts here. Validated, rate limited, honeypot-guarded. */
export async function POST(request: Request) {
  if (!rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return fail('Too many messages from this connection. Please wait a few minutes and try again.', 429);
  }

  const parsed = await parseJson(request, ContactSchema);
  if ('response' in parsed) return parsed.response;
  const { website, ...msg } = parsed.data;

  // Bots fill the hidden field; pretend success so they don't retry.
  if (website) return ok({ id: 'ignored' }, 201);

  try {
    const saved = createContactMessage({
      name: msg.name,
      email: msg.email,
      typology: msg.typology || null,
      scale: msg.scale || null,
      message: msg.message,
    });
    return ok({ id: saved.id }, 201);
  } catch (err) {
    return serverError('contact create', err);
  }
}
