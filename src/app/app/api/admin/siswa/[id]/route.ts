import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { nisn, nama, kelasId, kontakOrangTua, tanggalLahir, noAbsen } = await request.json();

    if (!nisn || nisn.length !== 10 || isNaN(Number(nisn))) {
      return NextResponse.json({ message: 'NISN harus 10 digit angka' }, { status: 400 });
    }

    if (!nama || !kelasId || !kontakOrangTua) {
      return NextResponse.json({ message: 'Nama, kelas, dan kontak orang tua wajib diisi' }, { status: 400 });
    }

    const existingSiswa = await prisma.siswa.findFirst({
      where: {
        nisn,
        NOT: { id }
      }
    });

    if (existingSiswa) {
      return NextResponse.json({ message: 'NISN sudah digunakan oleh siswa lain' }, { status: 400 });
    }

    const updatedSiswa = await prisma.siswa.update({
      where: { id },
      data: { 
        nisn, 
        nama, 
        kelasId, 
        kontakOrangTua,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        noAbsen: noAbsen ? parseInt(noAbsen, 10) : null
      }
    });

    return NextResponse.json(updatedSiswa);
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui data siswa' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Ambil data siswa untuk mendapatkan userId dan orangTuaUserId
    const siswa = await prisma.siswa.findUnique({
      where: { id },
      select: { userId: true, orangTuaUserId: true }
    });

    if (!siswa) {
      return NextResponse.json({ message: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus Siswa
      await tx.siswa.delete({ where: { id } });

      // 2. Hapus User Siswa jika ada
      if (siswa.userId) {
        await tx.user.delete({ where: { id: siswa.userId } }).catch(() => {});
      }

      // 3. Hapus User Orang Tua jika ada
      if (siswa.orangTuaUserId) {
        await tx.user.delete({ where: { id: siswa.orangTuaUserId } }).catch(() => {});
      }
    });

    return NextResponse.json({ message: 'Data siswa berhasil dihapus' });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ message: 'Gagal menghapus data siswa' }, { status: 500 });
  }
}

