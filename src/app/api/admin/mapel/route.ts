import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

function getSubjectSortWeight(kode: string, nama: string): number {
  const codeUpper = kode.toUpperCase();
  const nameLower = nama.toLowerCase();

  // 1. Pendidikan Agama (PAI / PABP)
  if (codeUpper === 'PAI' || codeUpper === 'PABP' || nameLower.includes('agama') || nameLower.includes('pabp') || nameLower.includes('pai')) return 1;
  // 2. Pendidikan Pancasila (PP)
  if (codeUpper === 'PP' || nameLower.includes('pancasila')) return 2;
  // 3. Bahasa Indonesia (IND)
  if (codeUpper === 'IND' || nameLower.includes('indonesia') || nameLower.includes('bahasa indonesia')) return 3;
  // 4. Matematika (MTK)
  if (codeUpper === 'MTK' || nameLower.includes('matematika')) return 4;
  // 5. Ilmu Pengetahuan Alam dan Sosial (IPAS)
  if (codeUpper === 'IPAS' || nameLower.includes('ipas') || (nameLower.includes('alam') && nameLower.includes('sosial'))) return 5;
  // 6. Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)
  if (codeUpper === 'PJOK' || nameLower.includes('pjok') || nameLower.includes('jasmani') || nameLower.includes('olahraga')) return 6;
  // 7. Seni dan Budaya / Seni Rupa (SRI / SB)
  if (codeUpper === 'SRI' || codeUpper === 'SB' || nameLower.includes('seni') || nameLower.includes('budaya') || nameLower.includes('rupa')) return 7;
  // 8. Bahasa Inggris (ING)
  if (codeUpper === 'ING' || nameLower.includes('inggris')) return 8;
  // 9. Bahasa Jawa (JAWA / BJAW)
  if (codeUpper === 'JAWA' || codeUpper === 'BJAW' || nameLower.includes('jawa')) return 9;
  // 10. Mapel Pilihan / Coding & AI (KAI / CODING)
  if (codeUpper === 'KAI' || codeUpper === 'CODING' || nameLower.includes('coding') || nameLower.includes('pilihan') || nameLower.includes('koding') || nameLower.includes('ai')) return 10;
  // 11. Kokurikuler (P5)
  if (codeUpper === 'P5' || nameLower.includes('p5') || nameLower.includes('projek') || nameLower.includes('kokurikuler')) return 11;

  // Fallback for other subjects
  return 100;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const mapel = await prisma.mataPelajaran.findMany();
    
    // Sort in-memory based on curriculum weight
    mapel.sort((a, b) => {
      const weightA = getSubjectSortWeight(a.kode, a.nama);
      const weightB = getSubjectSortWeight(b.kode, b.nama);
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return a.nama.localeCompare(b.nama);
    });

    return NextResponse.json(mapel);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data mata pelajaran' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { nama, kode } = await request.json();

    if (!nama || !kode) {
      return NextResponse.json({ message: 'Nama dan kode mata pelajaran wajib diisi' }, { status: 400 });
    }

    const uppercaseKode = kode.toUpperCase();

    // Check unique kode
    const existing = await prisma.mataPelajaran.findUnique({
      where: { kode: uppercaseKode },
    });

    if (existing) {
      return NextResponse.json({ message: 'Kode mata pelajaran sudah terdaftar' }, { status: 400 });
    }

    const newMapel = await prisma.mataPelajaran.create({
      data: {
        nama,
        kode: uppercaseKode,
      },
    });

    return NextResponse.json(newMapel, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menambahkan mata pelajaran' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id, nama, kode } = await request.json();

    if (!id || !nama || !kode) {
      return NextResponse.json({ message: 'ID, nama, dan kode mata pelajaran wajib diisi' }, { status: 400 });
    }

    const uppercaseKode = kode.toUpperCase();

    // Check unique kode (exclude current item)
    const existing = await prisma.mataPelajaran.findFirst({
      where: {
        kode: uppercaseKode,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Kode mata pelajaran sudah digunakan oleh pelajaran lain' }, { status: 400 });
    }

    const updated = await prisma.mataPelajaran.update({
      where: { id },
      data: {
        nama,
        kode: uppercaseKode,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memperbarui mata pelajaran' }, { status: 500 });
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
      return NextResponse.json({ message: 'ID mata pelajaran wajib disertakan' }, { status: 400 });
    }

    await prisma.mataPelajaran.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus mata pelajaran' }, { status: 500 });
  }
}
