import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { store } from '@/lib/store';
import { hashPassword, signToken } from '@/lib/auth';
import { getTokenCookieName, TOKEN_TTL_SECONDS } from '@/lib/token';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const exists = store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: randomUUID(),
    email,
    passwordHash,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);

  const token = signToken(user);
  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 },
  );

  response.cookies.set(getTokenCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });

  return response;
}
