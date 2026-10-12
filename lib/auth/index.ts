import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getAdminByUsername } from '@/lib/db';
import { createJwt, verifyJwt } from './jwt';

const COOKIE_NAME = 'cvi_admin_session';

export interface AdminSession {
  userId: string;
  username: string;
  name: string;
  role: string;
}

export async function signSession(payload: AdminSession): Promise<string> {
  return createJwt(payload, 60 * 60 * 24 * 7);
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  const payload = await verifyJwt(token);
  if (!payload) return null;
  return {
    userId: payload.userId as string,
    username: payload.username as string,
    name: payload.name as string,
    role: payload.role as string,
  };
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function loginAdmin(username: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminByUsername(username);
  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }

  const isValid = bcrypt.compareSync(passwordPlain, admin.password_hash);
  if (!isValid) {
    return { success: false, error: 'Invalid credentials' };
  }

  const token = await signSession({
    userId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
