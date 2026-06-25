import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kelasId = searchParams.get('kelasId');
  const tanggal = searchParams.get('tanggal');

  try {
    // Jika login sebagai Kepala Sekolah, boleh melihat jurnal semua guru / filter
    if (user.role === 'KEPALA_SEKOLAH') {
      const whereClause: any = {};
      if (kelasId) whereClause.kelasId = kelasId;
      if (tanggal) {
        const date = new Date(tanggal);
        date.setHours(0, 0, 0, 0);
        whereClause.tanggal = date;
      }

      const jurnal = await prisma.jurnalHarian.findMany({
        where: whereClause,
        include: {
          kelas: { select: { nama: true } },
          guru: { select: { nama: true } },
          mataPelajaran: { select: { nama: true, kode: true } },
        },
        orderBy: { tanggal: 'desc' },
      });
      return NextResponse.json(jurnal);
    }

    // Jika Guru biasa, hanya melihat jurnal miliknya sendiri
    if (user.role === 'GURU') {
      if (!user.guru) {
        return NextResponse.json({ message: 'Profil Guru tidak ditemukan' }, { status: 404 });
      }

      const whereClause: any = { guruId: user.guru.id };
      if (kelasId) whereClause.kelasId = kelasId;

      const jurnal = await prisma.jurnalHarian.findMany({
        where: whereClause,
        include: {
          kelas: { select: { nama: true } },
          guru: { select: { nama: true } },
          mataPelajaran: { select: { nama: true, kode: true } },
        },
        orderBy: { tanggal: 'desc' },
      });
      return NextResponse.json(jurnal);
    }

    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
  } catch (error) {
    console.error('GET Jurnal error:', error);
    return NextResponse.json({ message: 'Gagal mengambil jurnal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU' || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { tanggal, kelasId, mataPelajaranId, materi, catatan } = await request.json();

    if (!tanggal || !kelasId || !mataPelajaranId || !materi) {
      return NextResponse.json({ message: 'Kolom tanggal, kelas, mapel, dan materi wajib diisi' }, { status: 400 });
    }

    const newJurnal = await prisma.jurnalHarian.create({
      data: {
        tanggal: new Date(tanggal),
        kelasId,
        guruId: user.guru.id,
        mataPelajaranId,
        materi,
        catatan,
      },
    });

    return NextResponse.json({ message: 'Jurnal harian berhasil dicatat', jurnal: newJurnal }, { status: 201 });
  } catch (error) {
    console.error('POST Jurnal error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan jurnal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU' || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id, tanggal, kelasId, mataPelajaranId, materi, catatan } = await request.json();

    if (!id || !tanggal || !kelasId || !mataPelajaranId || !materi) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Verifikasi kepemilikan jurnal sebelum edit
    const existing = await prisma.jurnalHarian.findUnique({ where: { id } });
    if (!existing || existing.guruId !== user.guru.id) {
      return NextResponse.json({ message: 'Jurnal tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    const updated = await prisma.jurnalHarian.update({
      where: { id },
      data: {
        tanggal: new Date(tanggal),
        kelasId,
        mataPelajaranId,
        materi,
        catatan,
      },
    });

    return NextResponse.json({ message: 'Jurnal berhasil diperbarui', jurnal: updated });
  } catch (error) {
    console.error('PUT Jurnal error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui jurnal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU' || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    // Verifikasi kepemilikan
    const existing = await prisma.jurnalHarian.findUnique({ where: { id } });
    if (!existing || existing.guruId !== user.guru.id) {
      return NextResponse.json({ message: 'Jurnal tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    await prisma.jurnalHarian.delete({ where: { id } });

    return NextResponse.json({ message: 'Jurnal berhasil dihapus' });
  } catch (error) {
    console.error('DELETE Jurnal error:', error);
    return NextResponse.json({ message: 'Gagal menghapus jurnal' }, { status: 500 });
  }
}
