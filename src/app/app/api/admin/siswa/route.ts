import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const siswa = await prisma.siswa.findMany({
      include: {
        kelas: {
          select: { nama: true }
        }
      },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });
    return NextResponse.json(siswa);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data siswa' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { nisn, nama, kelasId, kontakOrangTua, tanggalLahir, noAbsen } = await request.json();

    if (!nisn || nisn.length !== 10 || isNaN(Number(nisn))) {
      return NextResponse.json({ message: 'NISN harus 10 digit angka' }, { status: 400 });
    }

    if (!nama || !kelasId || !kontakOrangTua) {
      return NextResponse.json({ message: 'Nama, kelas, dan kontak orang tua wajib diisi' }, { status: 400 });
    }

    // Cek apakah NISN sudah terdaftar
    const existingSiswa = await prisma.siswa.findUnique({
      where: { nisn }
    });

    if (existingSiswa) {
      return NextResponse.json({ message: 'Siswa dengan NISN ini sudah terdaftar' }, { status: 400 });
    }

    // Hash default passwords
    const studentPasswordHash = await bcrypt.hash('siswa123', 10);
    const parentPasswordHash = await bcrypt.hash('ortu123', 10);

    const newSiswa = await prisma.$transaction(async (tx) => {
      // 1. Create Siswa User
      const studentUser = await tx.user.create({
        data: {
          username: nisn,
          password: studentPasswordHash,
          role: 'SISWA'
        }
      });

      // 2. Create Ortu User
      const parentUser = await tx.user.create({
        data: {
          username: `ortu.${nisn}`,
          password: parentPasswordHash,
          role: 'ORANG_TUA'
        }
      });

      // 3. Create Siswa
      const siswa = await tx.siswa.create({
        data: {
          nisn,
          nama,
          kelasId,
          kontakOrangTua,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
          userId: studentUser.id,
          orangTuaUserId: parentUser.id,
          noAbsen: noAbsen ? parseInt(noAbsen, 10) : null
        }
      });

      return siswa;
    });

    return NextResponse.json(newSiswa, { status: 201 });
  } catch (error) {
    console.error('Create Siswa error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan data siswa' }, { status: 500 });
  }
}

