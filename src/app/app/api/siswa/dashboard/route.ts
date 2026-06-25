import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'SISWA' && user.role !== 'ORANG_TUA')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    // 1. Cari data siswa berdasarkan role user yang login
    let siswa = null;
    if (user.role === 'SISWA') {
      siswa = await prisma.siswa.findUnique({
        where: { userId: user.id },
        include: {
          kelas: {
            include: { tahunAjaran: true },
          },
        },
      });
    } else if (user.role === 'ORANG_TUA') {
      siswa = await prisma.siswa.findUnique({
        where: { orangTuaUserId: user.id },
        include: {
          kelas: {
            include: { tahunAjaran: true },
          },
        },
      });
    }

    if (!siswa) {
      return NextResponse.json({ message: 'Data siswa tidak ditemukan' }, { status: 404 });
    }

    // 2. Ambil data absensi & hitung statistik
    const absensi = await prisma.absensi.findMany({
      where: { siswaId: siswa.id },
    });

    const statistikAbsensi = {
      HADIR: absensi.filter((a) => a.status === 'HADIR').length,
      IZIN: absensi.filter((a) => a.status === 'IZIN').length,
      SAKIT: absensi.filter((a) => a.status === 'SAKIT').length,
      ALPA: absensi.filter((a) => a.status === 'ALPA').length,
      TOTAL: absensi.length,
    };

    // 3. Ambil jadwal pelajaran kelas siswa
    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: { kelasId: siswa.kelasId },
      include: {
        mataPelajaran: true,
        guru: true,
      },
      orderBy: { jamMulai: 'asc' },
    });

    // Custom sorting helper untuk Hari
    const hariOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const sortedJadwal = [...jadwal].sort((a, b) => {
      return hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari);
    });

    // 4. Ambil semua mata pelajaran yang ada untuk tabulasi nilai
    const mapelList = await prisma.mataPelajaran.findMany({
      orderBy: { nama: 'asc' },
    });

    // Ambil data nilai siswa
    const nilaiList = await prisma.nilai.findMany({
      where: { siswaId: siswa.id },
      include: {
        mataPelajaran: true,
      },
    });

    // Format tabulasi nilai per mata pelajaran
    const rekapNilai = mapelList.map((mapel) => {
      const dbNilai = nilaiList.find((n) => n.mataPelajaranId === mapel.id);

      return {
        mapelId: mapel.id,
        namaMapel: mapel.nama,
        kodeMapel: mapel.kode,
        harian1: dbNilai?.harian1 ?? '-',
        harian2: dbNilai?.harian2 ?? '-',
        harian3: dbNilai?.harian3 ?? '-',
        harian4: dbNilai?.harian4 ?? '-',
        harian5: dbNilai?.harian5 ?? '-',
        harian6: dbNilai?.harian6 ?? '-',
        uts: dbNilai?.uts ?? '-',
        uas: dbNilai?.uas ?? '-',
        rapor: dbNilai?.rapor ?? '-',
      };
    }).filter((r) => 
      r.harian1 !== '-' || r.harian2 !== '-' || r.harian3 !== '-' ||
      r.harian4 !== '-' || r.harian5 !== '-' || r.harian6 !== '-' ||
      r.uts !== '-' || r.uas !== '-'
    );

    return NextResponse.json({
      siswa: {
        id: siswa.id,
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas.nama,
        tahunAjaran: siswa.kelas.tahunAjaran.tahun,
      },
      statistikAbsensi,
      jadwal: sortedJadwal,
      nilai: rekapNilai,
    });
  } catch (error) {
    console.error('Siswa dashboard API error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data dashboard siswa' }, { status: 500 });
  }
}
