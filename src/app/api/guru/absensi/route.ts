import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { StatusAbsensi } from '@prisma/client';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  if (!user.guru) {
    return NextResponse.json({ message: 'Profil guru tidak ditemukan' }, { status: 400 });
  }
  const guruId = user.guru.id;

  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    const tanggalStr = searchParams.get('tanggal'); // YYYY-MM-DD

    if (!kelasId || !tanggalStr) {
      return NextResponse.json({ message: 'kelasId dan tanggal wajib diisi' }, { status: 400 });
    }

    const tanggal = new Date(tanggalStr);
    if (isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: 'Format tanggal salah' }, { status: 400 });
    }

    // 1. Ambil semua siswa di kelas ini
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });

    // 2. Ambil log absensi pada tanggal tersebut
    const absensiLogs = await prisma.absensi.findMany({
      where: {
        siswa: { kelasId },
        tanggal: tanggal
      }
    });

    // Petakan log ke siswa
    const logsMap = new Map<string, string>();
    absensiLogs.forEach(log => logsMap.set(log.siswaId, log.status));

    const result = siswaList.map(s => ({
      id: s.id,
      nisn: s.nisn,
      nama: s.nama,
      status: logsMap.get(s.id) || null
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get Absensi error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data absensi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  if (!user.guru) {
    return NextResponse.json({ message: 'Profil guru tidak ditemukan' }, { status: 400 });
  }
  const guruId = user.guru.id;

  try {
    const { kelasId, tanggalStr, absensiData } = await request.json();

    if (!kelasId || !tanggalStr || !absensiData || !Array.isArray(absensiData)) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const tanggal = new Date(tanggalStr);
    if (isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: 'Format tanggal salah' }, { status: 400 });
    }

    // Upsert secara transaksional
    const operations = absensiData.map((item: { siswaId: string; status: StatusAbsensi }) => {
      return prisma.absensi.upsert({
        where: {
          siswaId_tanggal: {
            siswaId: item.siswaId,
            tanggal: tanggal
          }
        },
        update: {
          status: item.status,
          diabsenOlehId: guruId
        },
        create: {
          siswaId: item.siswaId,
          tanggal: tanggal,
          status: item.status,
          diabsenOlehId: guruId
        }
      });
    });

    await prisma.$transaction(operations);

    return NextResponse.json({ message: 'Absensi berhasil disimpan' });
  } catch (error) {
    console.error('Save Absensi error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan absensi' }, { status: 500 });
  }
}
