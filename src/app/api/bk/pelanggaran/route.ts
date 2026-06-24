import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

// Hak Akses: GURU_BK dan KEPALA_SEKOLAH saja
async function checkAuth() {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const pelanggaran = await prisma.pelanggaranSiswa.findMany({
      include: {
        siswa: {
          select: {
            nama: true,
            nisn: true,
            kelas: { select: { nama: true } },
          },
        },
      },
      orderBy: { tanggal: 'desc' },
    });

    // Dekripsi kolom keterangan sensitif sebelum dikirim ke client
    const decryptedPelanggaran = pelanggaran.map((item) => ({
      ...item,
      keterangan: decrypt(item.keterangan),
    }));

    return NextResponse.json(decryptedPelanggaran);
  } catch (error) {
    console.error('GET BK Pelanggaran error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data pelanggaran siswa' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { siswaId, tanggal, namaPelanggaran, poin, keterangan, dilaporkanOleh } = await request.json();

    if (!siswaId || !tanggal || !namaPelanggaran || poin === undefined || !keterangan || !dilaporkanOleh) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Enkripsi data sensitif keterangan pelanggaran
    const encryptedKeterangan = encrypt(keterangan);

    const newPelanggaran = await prisma.pelanggaranSiswa.create({
      data: {
        siswaId,
        tanggal: new Date(tanggal),
        namaPelanggaran,
        poin: parseInt(poin, 10),
        keterangan: encryptedKeterangan,
        dilaporkanOleh,
      },
    });

    return NextResponse.json({
      message: 'Pelanggaran siswa berhasil ditambahkan',
      pelanggaran: {
        ...newPelanggaran,
        keterangan: decrypt(newPelanggaran.keterangan),
      },
    });
  } catch (error) {
    console.error('POST BK Pelanggaran error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan pelanggaran siswa' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id, namaPelanggaran, poin, keterangan, dilaporkanOleh, tanggal } = await request.json();

    if (!id || !namaPelanggaran || poin === undefined || !keterangan || !dilaporkanOleh || !tanggal) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Enkripsi data sensitif
    const encryptedKeterangan = encrypt(keterangan);

    const updated = await prisma.pelanggaranSiswa.update({
      where: { id },
      data: {
        tanggal: new Date(tanggal),
        namaPelanggaran,
        poin: parseInt(poin, 10),
        keterangan: encryptedKeterangan,
        dilaporkanOleh,
      },
    });

    return NextResponse.json({
      message: 'Pelanggaran siswa berhasil diperbarui',
      pelanggaran: {
        ...updated,
        keterangan: decrypt(updated.keterangan),
      },
    });
  } catch (error) {
    console.error('PUT BK Pelanggaran error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui data pelanggaran' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });
    }

    await prisma.pelanggaranSiswa.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Pelanggaran siswa berhasil dihapus' });
  } catch (error) {
    console.error('DELETE BK Pelanggaran error:', error);
    return NextResponse.json({ message: 'Gagal menghapus pelanggaran siswa' }, { status: 500 });
  }
}
