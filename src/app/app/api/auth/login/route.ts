import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    let targetUsername = username;
    if (username === 'admin') {
      try {
        const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (!adminExists) {
          const oldAdmin = await prisma.user.findUnique({ where: { username: 'admin.tu' } });
          if (oldAdmin) {
            await prisma.user.update({
              where: { username: 'admin.tu' },
              data: { username: 'admin' }
            });
          }
        }
      } catch (err) {
        console.error('Failed to migrate admin.tu to admin:', err);
      }
    }

    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
