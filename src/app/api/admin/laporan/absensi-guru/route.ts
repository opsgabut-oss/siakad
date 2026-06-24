import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'KEPALA_SEKOLAH' && user.role !== 'GURU_BK')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan'); // Format: YYYY-MM

    let year: number;
    let month: number;

    if (bulan) {
      const [y, m] = bulan.split('-');
      year = parseInt(y, 10);
      month = parseInt(m, 10) - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Ambil semua guru
    const gurus = await prisma.guru.findMany({
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });

    // Ambil semua absensi guru pada range bulan ini
    const absensiRecords = await prisma.absensiGuru.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Hitung jumlah hari aktif KBM bulan ini (jumlah hari di mana ada minimal satu guru check-in)
    const uniqueDates = Array.from(new Set(absensiRecords.map(r => r.tanggal.toISOString().split('T')[0])));
    
    // Hitung default hari kerja (Senin-Sabtu) untuk bulan ini jika belum ada data check-in
    let defaultHariKerja = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() !== 0) { // Bukan hari Minggu (0)
        defaultHariKerja++;
      }
    }
    const totalHariKerja = uniqueDates.length || defaultHariKerja;

    const rows = gurus.map(g => {
      const gAbs = absensiRecords.filter(r => r.guruId === g.id);
      const hadir = gAbs.filter(r => r.status === 'HADIR').length;
      const izin = gAbs.filter(r => r.status === 'IZIN').length;
      const sakit = gAbs.filter(r => r.status === 'SAKIT').length;
      const alpa = gAbs.filter(r => r.status === 'ALPA').length;
      
      // Hari kerja tersisa yang tidak diisi diasumsikan ALPA / Belum Absen
      const totalAbsenInput = hadir + izin + sakit + alpa;
      const computedAlpa = Math.max(0, totalHariKerja - totalAbsenInput) + alpa;
      
      const persentase = totalHariKerja > 0 
        ? Math.round((hadir / totalHariKerja) * 100)
        : 100;

      return {
        guruId: g.id,
        nama: g.nama,
        nip: g.nip || '-',
        nik: g.nik || '-',
        pangkat: g.pangkat || '-',
        golongan: g.golongan || '-',
        hadir,
        izin,
        sakit,
        alpa: computedAlpa,
        total: totalHariKerja,
        persentase
      };
    });

    return NextResponse.json({
      rows,
      statistik: {
        totalHariKerja,
        totalGuru: gurus.length
      }
    });
  } catch (error) {
    console.error('Fetch rekap absensi guru error:', error);
    return NextResponse.json({ message: 'Gagal mengambil rekap absensi guru' }, { status: 500 });
  }
}
