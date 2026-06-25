import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { Hari } from '@prisma/client';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'SISWA' && user.role !== 'ORANG_TUA')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    const getMyJadwal = searchParams.get('my');

    const query: any = {};
    if (kelasId) {
      query.kelasId = kelasId;
    }

    if (getMyJadwal === 'true' && user.role === 'GURU') {
      const guru = await prisma.guru.findUnique({
        where: { userId: user.id },
      });
      if (guru) {
        query.guruId = guru.id;
      } else {
        return NextResponse.json([]);
      }
    }

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: query,
      include: {
        kelas: true,
        mataPelajaran: true,
        guru: true,
      },
      orderBy: [
        { hari: 'asc' },
        { jamMulai: 'asc' },
      ],
    });

    // Custom sorting helper for Hari enum
    const hariOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const sortedJadwal = [...jadwal].sort((a, b) => {
      const dayDiff = hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari);
      if (dayDiff !== 0) return dayDiff;
      return a.jamMulai.localeCompare(b.jamMulai);
    });

    return NextResponse.json(sortedJadwal);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data jadwal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { kelasId, mataPelajaranId, guruId, hari, jamMulai, jamSelesai } = await request.json();

    if (!kelasId || !mataPelajaranId || !guruId || !hari || !jamMulai || !jamSelesai) {
      return NextResponse.json({ message: 'Semua kolom jadwal wajib diisi' }, { status: 400 });
    }

    if (!Object.values(Hari).includes(hari)) {
      return NextResponse.json({ message: 'Hari tidak valid' }, { status: 400 });
    }

    const newJadwal = await prisma.jadwalPelajaran.create({
      data: {
        kelasId,
        mataPelajaranId,
        guruId,
        hari: hari as Hari,
        jamMulai,
        jamSelesai,
      },
      include: {
        kelas: true,
        mataPelajaran: true,
        guru: true,
      },
    });

    return NextResponse.json(newJadwal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menambahkan jadwal pelajaran' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id, kelasId, mataPelajaranId, guruId, hari, jamMulai, jamSelesai } = await request.json();

    if (!id || !kelasId || !mataPelajaranId || !guruId || !hari || !jamMulai || !jamSelesai) {
      return NextResponse.json({ message: 'Semua kolom jadwal wajib diisi' }, { status: 400 });
    }

    if (!Object.values(Hari).includes(hari)) {
      return NextResponse.json({ message: 'Hari tidak valid' }, { status: 400 });
    }

    const updated = await prisma.jadwalPelajaran.update({
      where: { id },
      data: {
        kelasId,
        mataPelajaranId,
        guruId,
        hari: hari as Hari,
        jamMulai,
        jamSelesai,
      },
      include: {
        kelas: true,
        mataPelajaran: true,
        guru: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memperbarui jadwal pelajaran' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID jadwal wajib disertakan' }, { status: 400 });
    }

    await prisma.jadwalPelajaran.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Jadwal pelajaran berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus jadwal pelajaran' }, { status: 500 });
  }
}
