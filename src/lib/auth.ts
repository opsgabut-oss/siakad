import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth_token');
    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const payload = verifyToken(tokenCookie.value);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        role: true,
        guru: {
          select: {
            id: true,
            nama: true,
            nip: true,
          },
        },
        siswa: {
          select: {
            id: true,
            nama: true,
            nisn: true,
            kelasId: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}
