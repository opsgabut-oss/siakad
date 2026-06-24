import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika tidak ada token dan mengakses rute terproteksi, redirect ke /login
  if (!token) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/guru') || pathname.startsWith('/siswa') || pathname === '/') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  try {
    // Decode JWT payload (bagian tengah dari JWT: header.payload.signature)
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      throw new Error('Format token salah');
    }
    
    // Decode base64 menggunakan atob bawaan
    const decodedPayload = JSON.parse(atob(payloadPart));
    const role = decodedPayload.role;

    // 2. Proteksi rute Admin TU
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      const target = role === 'GURU' ? '/guru/dashboard' : (role === 'GURU_BK' || role === 'KEPALA_SEKOLAH' ? '/bk/dashboard' : (role === 'SISWA' || role === 'ORANG_TUA' ? '/siswa/dashboard' : '/login'));
      return NextResponse.redirect(new URL(target, request.url));
    }

    // 3. Proteksi rute Guru
    if (pathname.startsWith('/guru') && role !== 'GURU') {
      const target = role === 'ADMIN' ? '/admin/dashboard' : (role === 'GURU_BK' || role === 'KEPALA_SEKOLAH' ? '/bk/dashboard' : (role === 'SISWA' || role === 'ORANG_TUA' ? '/siswa/dashboard' : '/login'));
      return NextResponse.redirect(new URL(target, request.url));
    }

    // 4. Proteksi rute Siswa & Orang Tua
    if (pathname.startsWith('/siswa') && role !== 'SISWA' && role !== 'ORANG_TUA') {
      const target = role === 'ADMIN' ? '/admin/dashboard' : (role === 'GURU' ? '/guru/dashboard' : (role === 'GURU_BK' || role === 'KEPALA_SEKOLAH' ? '/bk/dashboard' : '/login'));
      return NextResponse.redirect(new URL(target, request.url));
    }

    // 4b. Proteksi rute BK & Kepala Sekolah (Kedisiplinan & Konseling)
    if (pathname.startsWith('/bk') && role !== 'GURU_BK' && role !== 'KEPALA_SEKOLAH') {
      const target = role === 'ADMIN' 
        ? '/admin/dashboard' 
        : role === 'GURU' 
          ? '/guru/dashboard' 
          : '/siswa/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // 5. Jika mengakses login atau root tapi sudah login, arahkan ke dashboard masing-masing
    if (pathname === '/login' || pathname === '/') {
      const target = role === 'ADMIN' 
        ? '/admin/dashboard' 
        : role === 'GURU' 
          ? '/guru/dashboard' 
          : (role === 'GURU_BK' || role === 'KEPALA_SEKOLAH' ? '/bk/dashboard' : '/siswa/dashboard');
      return NextResponse.redirect(new URL(target, request.url));
    }
  } catch (error) {
    // Jika terjadi error parsing, hapus cookie dan redirect ke login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/guru/:path*', '/siswa/:path*', '/bk/:path*'],
};
