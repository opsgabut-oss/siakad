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
    const catatan = await prisma.catatanBK.findMany({
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

    // Dekripsi kolom sensitif sebelum dikirim ke client
    const decryptedCatatan = catatan.map((item) => ({
      ...item,
      permasalahan: decrypt(item.permasalahan),
      tindakan: decrypt(item.tindakan),
    }));

    return NextResponse.json(decryptedCatatan);
  } catch (error) {
    console.error('GET BK Kasus error:', error);
    return NextResponse.json({ message: 'Gagal mengambil catatan BK' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { siswaId, tanggal, kategori, permasalahan, tindakan, status } = await request.json();

    if (!siswaId || !tanggal || !kategori || !permasalahan || !tindakan || !status) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Enkripsi data sensitif tingkat database
    const encryptedPermasalahan = encrypt(permasalahan);
    const encryptedTindakan = encrypt(tindakan);

    const newCatatan = await prisma.catatanBK.create({
      data: {
        siswaId,
        tanggal: new Date(tanggal),
        kategori,
        permasalahan: encryptedPermasalahan,
        tindakan: encryptedTindakan,
        status,
      },
    });

    return NextResponse.json({
      message: 'Catatan BK berhasil ditambahkan',
      catatan: {
        ...newCatatan,
        permasalahan: decrypt(newCatatan.permasalahan),
        tindakan: decrypt(newCatatan.tindakan),
      },
    });
  } catch (error) {
    console.error('POST BK Kasus error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan catatan BK' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id, kategori, permasalahan, tindakan, status, tanggal } = await request.json();

    if (!id || !kategori || !permasalahan || !tindakan || !status || !tanggal) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi' }, { status: 400 });
    }

    // Enkripsi data sensitif tingkat database
    const encryptedPermasalahan = encrypt(permasalahan);
    const encryptedTindakan = encrypt(tindakan);

    const updated = await prisma.catatanBK.update({
      where: { id },
      data: {
        tanggal: new Date(tanggal),
        kategori,
        permasalahan: encryptedPermasalahan,
        tindakan: encryptedTindakan,
        status,
      },
    });

    return NextResponse.json({
      message: 'Catatan BK berhasil diperbarui',
      catatan: {
        ...updated,
        permasalahan: decrypt(updated.permasalahan),
        tindakan: decrypt(updated.tindakan),
      },
    });
  } catch (error) {
    console.error('PUT BK Kasus error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui catatan BK' }, { status: 500 });
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

    await prisma.catatanBK.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Catatan BK berhasil dihapus' });
  } catch (error) {
    console.error('DELETE BK Kasus error:', error);
    return NextResponse.json({ message: 'Gagal menghapus catatan BK' }, { status: 500 });
  }
}
