import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { siswaIds, targetKelasId, action } = await request.json();

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return NextResponse.json({ message: 'Siswa wajib dipilih' }, { status: 400 });
    }

    let finalKelasId = targetKelasId;

    if (action === 'GRADUATE') {
      // Find active academic year
      const activeTA = await prisma.tahunAjaran.findFirst({
        where: { aktif: true }
      });
      if (!activeTA) {
        return NextResponse.json({ message: 'Tahun ajaran aktif tidak ditemukan' }, { status: 400 });
      }

      // Find or create "Alumni" class under active academic year
      let alumniKelas = await prisma.kelas.findFirst({
        where: { nama: 'Alumni', tahunAjaranId: activeTA.id }
      });

      if (!alumniKelas) {
        alumniKelas = await prisma.kelas.create({
          data: {
            nama: 'Alumni',
            tahunAjaranId: activeTA.id
          }
        });
      }
      finalKelasId = alumniKelas.id;
    } else {
      if (!targetKelasId) {
        return NextResponse.json({ message: 'Kelas tujuan wajib ditentukan' }, { status: 400 });
      }
    }

    // Update all matching students' kelasId
    await prisma.siswa.updateMany({
      where: {
        id: { in: siswaIds }
      },
      data: {
        kelasId: finalKelasId
      }
    });

    return NextResponse.json({ message: 'Proses kenaikan kelas / kelulusan berhasil diproses' });
  } catch (error) {
    console.error('Kenaikan kelas error:', error);
    return NextResponse.json({ message: 'Gagal memproses kenaikan kelas' }, { status: 500 });
  }
}
