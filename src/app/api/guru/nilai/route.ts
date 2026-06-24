import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    const mataPelajaranId = searchParams.get('mataPelajaranId');

    if (!kelasId || !mataPelajaranId) {
      return NextResponse.json({ message: 'kelasId dan mataPelajaranId wajib disertakan' }, { status: 400 });
    }

    // Ambil daftar siswa di kelas tersebut
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ],
    });

    // Ambil semua nilai di kelas tersebut untuk mapel tersebut
    const nilaiList = await prisma.nilai.findMany({
      where: {
        mataPelajaranId,
        siswa: { kelasId },
      },
    });

    // Gabungkan data agar mudah diolah di frontend
    const result = siswaList.map((siswa) => {
      const dbNilai = nilaiList.find((n) => n.siswaId === siswa.id) || null;
      return {
        siswaId: siswa.id,
        nisn: siswa.nisn,
        nama: siswa.nama,
        harian1: dbNilai?.harian1 ?? null,
        harian2: dbNilai?.harian2 ?? null,
        harian3: dbNilai?.harian3 ?? null,
        harian4: dbNilai?.harian4 ?? null,
        harian5: dbNilai?.harian5 ?? null,
        harian6: dbNilai?.harian6 ?? null,
        uts: dbNilai?.uts ?? null,
        uas: dbNilai?.uas ?? null,
        rapor: dbNilai?.rapor ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data nilai' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { mataPelajaranId, grades } = await request.json();

    if (!mataPelajaranId || !grades || !Array.isArray(grades)) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const parseGradeValue = (val: any): number | null => {
      if (val === undefined || val === null || val === '') return null;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        throw new Error('Nilai harus berupa angka antara 0 - 100');
      }
      return parsed;
    };

    const calculateRapor = (
      h1: number | null,
      h2: number | null,
      h3: number | null,
      h4: number | null,
      h5: number | null,
      h6: number | null,
      uts: number | null,
      uas: number | null
    ): number | null => {
      const harianVals = [h1, h2, h3, h4, h5, h6].filter((v): v is number => v !== null);
      const avgHarian = harianVals.length > 0 
        ? harianVals.reduce((sum, v) => sum + v, 0) / harianVals.length 
        : null;

      const components: number[] = [];
      if (avgHarian !== null) components.push(avgHarian);
      if (uts !== null) components.push(uts);
      if (uas !== null) components.push(uas);

      if (components.length === 0) return null;
      return Math.round(components.reduce((sum, v) => sum + v, 0) / components.length);
    };

    const finalResult = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const g of grades) {
        const { siswaId, harian1, harian2, harian3, harian4, harian5, harian6, uts, uas } = g;
        if (siswaId) {
          const h1 = parseGradeValue(harian1);
          const h2 = parseGradeValue(harian2);
          const h3 = parseGradeValue(harian3);
          const h4 = parseGradeValue(harian4);
          const h5 = parseGradeValue(harian5);
          const h6 = parseGradeValue(harian6);
          const u = parseGradeValue(uts);
          const a = parseGradeValue(uas);
          const r = calculateRapor(h1, h2, h3, h4, h5, h6, u, a);

          const existing = await tx.nilai.findUnique({
            where: {
              siswaId_mataPelajaranId: {
                siswaId,
                mataPelajaranId,
              },
            },
          });

          if (existing) {
            const updated = await tx.nilai.update({
              where: { id: existing.id },
              data: {
                harian1: h1,
                harian2: h2,
                harian3: h3,
                harian4: h4,
                harian5: h5,
                harian6: h6,
                uts: u,
                uas: a,
                rapor: r,
              },
            });
            records.push(updated);
          } else {
            const created = await tx.nilai.create({
              data: {
                siswaId,
                mataPelajaranId,
                harian1: h1,
                harian2: h2,
                harian3: h3,
                harian4: h4,
                harian5: h5,
                harian6: h6,
                uts: u,
                uas: a,
                rapor: r,
              },
            });
            records.push(created);
          }
        }
      }
      return records;
    });

    return NextResponse.json({ message: 'Nilai berhasil disimpan', data: finalResult });
  } catch (error: any) {
    console.error('Save grades error:', error);
    return NextResponse.json({ message: error.message || 'Gagal menyimpan nilai' }, { status: 500 });
  }
}
