import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const kelas = await prisma.kelas.findMany({
      include: {
        waliKelas: {
          select: { id: true, nama: true, nip: true }
        },
        tahunAjaran: {
          select: { tahun: true, aktif: true }
        }
      },
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json(kelas);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data kelas' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { kelasId, waliKelasId } = await request.json();

    if (!kelasId) {
      return NextResponse.json({ message: 'kelasId wajib disertakan' }, { status: 400 });
    }

    // Jika waliKelasId diberikan, pastikan guru tersebut tidak sedang ditugaskan di kelas lain
    if (waliKelasId) {
      const existingAssignment = await prisma.kelas.findFirst({
        where: {
          waliKelasId,
          NOT: { id: kelasId }
        }
      });

      if (existingAssignment) {
        // Lepas guru tersebut dari kelas lamanya terlebih dahulu (karena relasi 1-ke-1)
        await prisma.kelas.update({
          where: { id: existingAssignment.id },
          data: { waliKelasId: null }
        });
      }
    }

    const updatedKelas = await prisma.kelas.update({
      where: { id: kelasId },
      data: { waliKelasId: waliKelasId || null },
      include: {
        waliKelas: {
          select: { id: true, nama: true, nip: true }
        },
        tahunAjaran: true
      }
    });

    return NextResponse.json(updatedKelas);
  } catch (error) {
    console.error('Assign Wali Kelas error:', error);
    return NextResponse.json({ message: 'Gagal mengatur wali kelas' }, { status: 500 });
  }
}
