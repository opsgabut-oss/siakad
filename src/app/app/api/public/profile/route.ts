import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profil = await prisma.profilSekolah.findFirst({
      select: {
        namaSekolah: true,
        logoSekolahUrl: true,
      },
    });
    return NextResponse.json(profil || { namaSekolah: 'SIAKAD', logoSekolahUrl: null });
  } catch (error) {
    console.error('Fetch public profile error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data profil' }, { status: 500 });
  }
}
