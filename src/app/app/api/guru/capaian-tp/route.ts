import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'KEPALA_SEKOLAH' && user.role !== 'ADMIN' && user.role !== 'GURU_BK')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    const mataPelajaranId = searchParams.get('mataPelajaranId');

    if (!kelasId || !mataPelajaranId) {
      return NextResponse.json({ message: 'kelasId dan mataPelajaranId wajib disertakan' }, { status: 400 });
    }

    // Ambil daftar siswa
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });

    // Ambil semua TP untuk mapel dan kelas tersebut
    const tps = await prisma.tujuanPembelajaran.findMany({
      where: { mataPelajaranId, kelasId },
      orderBy: [
        { semester: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Ambil rekam capaian yang ada
    const capaianRecords = await prisma.capaianTP.findMany({
      where: {
        siswa: { kelasId },
        tujuanPembelajaran: { mataPelajaranId }
      }
    });

    // Ambil nilai siswa
    const nilaiList = await prisma.nilai.findMany({
      where: {
        mataPelajaranId,
        siswa: { kelasId }
      }
    });

    // Petakan gabungan data
    const result = siswaList.map((siswa) => {
      const studentNilai = nilaiList.find((n) => n.siswaId === siswa.id);
      const raporNilai = studentNilai?.rapor;

      const capaian = tps.map((tp) => {
        const record = capaianRecords.find(
          (r) => r.siswaId === siswa.id && r.tujuanPembelajaranId === tp.id
        );

        // Jika ada record manual, gunakan itu.
        // Jika tidak ada record manual, tapi nilai rapor sudah diisi:
        //   - Rapor >= KKTP TP -> Tercapai (true)
        //   - Rapor < KKTP TP -> Bimbingan (false)
        // Jika nilai rapor belum diisi, default ke true.
        let autoTercapai = true;
        if (raporNilai !== undefined && raporNilai !== null) {
          autoTercapai = raporNilai >= tp.kktp;
        }

        return {
          tujuanPembelajaranId: tp.id,
          deskripsi: tp.deskripsi,
          semester: tp.semester,
          tercapai: record ? record.tercapai : autoTercapai
        };
      });

      return {
        siswaId: siswa.id,
        nama: siswa.nama,
        nisn: siswa.nisn,
        capaian
      };
    });

    return NextResponse.json({
      tps,
      students: result
    });
  } catch (error) {
    console.error('Fetch Capaian TP error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data capaian TP' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { achievements } = body; // Array of { siswaId, tujuanPembelajaranId, tercapai }

    if (!achievements || !Array.isArray(achievements)) {
      return NextResponse.json({ message: 'Data achievements wajib disertakan' }, { status: 400 });
    }

    await prisma.$transaction(
      achievements.map((a) =>
        prisma.capaianTP.upsert({
          where: {
            siswaId_tujuanPembelajaranId: {
              siswaId: a.siswaId,
              tujuanPembelajaranId: a.tujuanPembelajaranId
            }
          },
          update: {
            tercapai: a.tercapai
          },
          create: {
            siswaId: a.siswaId,
            tujuanPembelajaranId: a.tujuanPembelajaranId,
            tercapai: a.tercapai
          }
        })
      )
    );

    return NextResponse.json({ message: 'Data capaian TP berhasil disimpan' });
  } catch (error: any) {
    console.error('Save Capaian TP error:', error);
    return NextResponse.json({ message: error.message || 'Gagal menyimpan data capaian TP' }, { status: 500 });
  }
}
