import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'KEPALA_SEKOLAH' && user.role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const modul = await prisma.modulAjar.findUnique({
        where: { id },
        include: {
          mataPelajaran: true,
          kelas: true,
          guru: true
        }
      });

      if (!modul) {
        return NextResponse.json({ message: 'Modul ajar tidak ditemukan' }, { status: 404 });
      }

      // Guru hanya boleh melihat modul ajarnya sendiri
      if (user.role === 'GURU') {
        const teacher = await prisma.guru.findUnique({ where: { userId: user.id } });
        if (!teacher || modul.guruId !== teacher.id) {
          return NextResponse.json({ message: 'Tidak diizinkan mengakses modul ajar ini' }, { status: 403 });
        }
      }

      return NextResponse.json(modul);
    }

    // List all
    let whereClause: any = {};
    if (user.role === 'GURU') {
      const teacher = await prisma.guru.findUnique({ where: { userId: user.id } });
      if (!teacher) {
        return NextResponse.json({ message: 'Profil guru tidak ditemukan' }, { status: 404 });
      }
      whereClause.guruId = teacher.id;
    }

    const modulList = await prisma.modulAjar.findMany({
      where: whereClause,
      include: {
        mataPelajaran: true,
        kelas: true,
        guru: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(modulList);
  } catch (error) {
    console.error('Fetch Modul Ajar error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data modul ajar' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const teacher = await prisma.guru.findUnique({ where: { userId: user.id } });
    if (!teacher) {
      return NextResponse.json({ message: 'Profil guru tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { id, judul, mataPelajaranId, kelasId, informasiUmum, komponenInti, lampiran } = body;

    if (!judul || !mataPelajaranId || !informasiUmum || !komponenInti) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    if (id) {
      // Verifikasi kepemilikan sebelum update
      const existing = await prisma.modulAjar.findUnique({ where: { id } });
      if (!existing || existing.guruId !== teacher.id) {
        return NextResponse.json({ message: 'Tidak diizinkan mengubah modul ajar ini' }, { status: 403 });
      }

      const updated = await prisma.modulAjar.update({
        where: { id },
        data: {
          judul,
          mataPelajaranId,
          kelasId: kelasId || null,
          informasiUmum,
          komponenInti,
          lampiran: lampiran || null
        }
      });

      return NextResponse.json({ message: 'Modul ajar berhasil diubah', data: updated });
    } else {
      // Create
      const created = await prisma.modulAjar.create({
        data: {
          judul,
          mataPelajaranId,
          kelasId: kelasId || null,
          guruId: teacher.id,
          informasiUmum,
          komponenInti,
          lampiran: lampiran || null
        }
      });

      return NextResponse.json({ message: 'Modul ajar berhasil dibuat', data: created });
    }
  } catch (error: any) {
    console.error('Save Modul Ajar error:', error);
    return NextResponse.json({ message: error.message || 'Gagal menyimpan modul ajar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'id wajib disertakan' }, { status: 400 });
    }

    const teacher = await prisma.guru.findUnique({ where: { userId: user.id } });
    if (!teacher) {
      return NextResponse.json({ message: 'Profil guru tidak ditemukan' }, { status: 404 });
    }

    const existing = await prisma.modulAjar.findUnique({ where: { id } });
    if (!existing || existing.guruId !== teacher.id) {
      return NextResponse.json({ message: 'Tidak diizinkan menghapus modul ajar ini' }, { status: 403 });
    }

    await prisma.modulAjar.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Modul ajar berhasil dihapus' });
  } catch (error) {
    console.error('Delete Modul Ajar error:', error);
    return NextResponse.json({ message: 'Gagal menghapus modul ajar' }, { status: 500 });
  }
}
