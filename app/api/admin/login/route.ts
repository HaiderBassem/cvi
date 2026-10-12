import { NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const result = await loginAdmin(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Authentication failed' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
