import { cookies } from 'next/headers';
import { verifyJwt, type JwtPayload } from './jwt';

export const AUTH_COOKIE = 'aetech_token';

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const c = await cookies();
  const token = c.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return await verifyJwt(token);
}

export async function requireAdmin(): Promise<JwtPayload | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}
