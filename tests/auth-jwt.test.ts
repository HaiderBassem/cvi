import { describe, it, expect } from 'vitest';
import { createJwt, verifyJwt } from '@/lib/auth/jwt';

describe('CVI Auth Web Crypto JWT Engine', () => {
  it('creates and verifies a valid token payload', async () => {
    const payload = { userId: 'usr_123', username: 'admin', role: 'architect_principal' };
    const token = await createJwt(payload, 3600);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifyJwt(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('usr_123');
    expect(verified?.username).toBe('admin');
    expect(verified?.role).toBe('architect_principal');
  });

  it('rejects tampered tokens', async () => {
    const token = await createJwt({ username: 'admin' }, 3600);
    const parts = token.split('.');
    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({ username: 'hacker' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verified = await verifyJwt(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects expired tokens', async () => {
    // Expired immediately (-10 seconds)
    const token = await createJwt({ username: 'admin' }, -10);
    const verified = await verifyJwt(token);
    expect(verified).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyJwt('')).toBeNull();
    expect(await verifyJwt('invalid.token')).toBeNull();
    expect(await verifyJwt('a.b.c.d')).toBeNull();
  });
});
