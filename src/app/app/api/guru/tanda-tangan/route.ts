import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const guru = await prisma.guru.findUnique({
      where: { id: user.guru.id },
      select: { tandaTangan: true },
    });

    return NextResponse.json({ tandaTangan: guru?.tandaTangan || null });
  } catch (error) {
    console.error('Fetch tanda tangan error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data tanda tangan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const { tandaTangan } = await request.json();

    if (!tandaTangan) {
      return NextResponse.json({ message: 'Tanda tangan tidak boleh kosong' }, { status: 400 });
    }

    // Validasi format Base64 image
    if (!tandaTangan.startsWith('data:image/')) {
      return NextResponse.json({ message: 'Format gambar tanda tangan tidak valid' }, { status: 400 });
    }

    const updatedGuru = await prisma.guru.update({
      where: { id: user.guru.id },
      data: { tandaTangan },
    });

    return NextResponse.json({
      message: 'Tanda tangan berhasil disimpan',
      tandaTangan: updatedGuru.tandaTangan,
    });
  } catch (error) {
    console.error('Save tanda tangan error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan tanda tangan' }, { status: 500 });
  }
}
