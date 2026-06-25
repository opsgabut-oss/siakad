import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'GURU' && user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');

    if (!kelasId) {
      return NextResponse.json({ message: 'kelasId wajib disertakan' }, { status: 400 });
    }

    // Ambil data kelas
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      include: { tahunAjaran: true },
    });

    if (!kelas) {
      return NextResponse.json({ message: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Ambil daftar siswa
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ],
    });

    const bulan = searchParams.get('bulan');
    let periodeLabel = 'Keseluruhan';

    const absensiWhereClause: any = {
      siswa: { kelasId },
    };

    if (bulan) {
      const [yearStr, monthStr] = bulan.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      absensiWhereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
      
      periodeLabel = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    // Ambil data absensi
    const absensiList = await prisma.absensi.findMany({
      where: absensiWhereClause,
    });

    // Generate konten CSV
    let csv = '\uFEFF'; // Byte Order Mark (BOM) agar Microsoft Excel membaca karakter UTF-8 dengan benar
    csv += `LAPORAN REKAPITULASI ABSENSI SISWA\n`;
    csv += `Kelas:;${kelas.nama}\n`;
    csv += `Tahun Ajaran:;${kelas.tahunAjaran.tahun}\n`;
    csv += `Tanggal Unduh:;${new Date().toLocaleDateString('id-ID')}\n\n`;
    
    // Header Kolom
    csv += `No;NISN;Nama Siswa;Hadir;Izin;Sakit;Alpa;Total Hari;Persentase Kehadiran\n`;

    siswaList.forEach((siswa, index) => {
      const absensiSiswa = absensiList.filter((a) => a.siswaId === siswa.id);
      const hadir = absensiSiswa.filter((a) => a.status === 'HADIR').length;
      const izin = absensiSiswa.filter((a) => a.status === 'IZIN').length;
      const sakit = absensiSiswa.filter((a) => a.status === 'SAKIT').length;
      const alpa = absensiSiswa.filter((a) => a.status === 'ALPA').length;
      const total = absensiSiswa.length;
      const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

      // Gunakan kutip dua untuk mengamankan karakter khusus, dan pembatas koma/titik-koma
      // Note: Di Excel Indonesia, pembatas titik-koma (;) lebih universal dibaca langsung dibanding koma (,)
      csv += `${index + 1};'${siswa.nisn};"${siswa.nama}";${hadir};${izin};${sakit};${alpa};${total};${persentase}%\n`;
    });

    const filename = `Laporan_Absensi_${kelas.nama.replace(/\s+/g, '_')}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Laporan Absensi CSV error:', error);
    return NextResponse.json({ message: 'Gagal membuat laporan absensi' }, { status: 500 });
  }
}
