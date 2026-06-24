import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const siswaList = await prisma.siswa.findMany({
      include: {
        kelas: true
      },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });

    let csv = '\uFEFF'; // BOM UTF-8
    csv += `DATA SISWA\n`;
    csv += `Tanggal Unduh:;${new Date().toLocaleDateString('id-ID')}\n\n`;
    csv += `nisn;nama;kelas;kontak orang tua;no_absen\n`;

    siswaList.forEach(s => {
      // replace any double quotes inside fields with single quotes to keep CSV valid
      const safeNama = s.nama.replace(/"/g, "'");
      const safeKelas = s.kelas.nama.replace(/"/g, "'");
      csv += `${s.nisn};"${safeNama}";"${safeKelas}";${s.kontakOrangTua};${s.noAbsen !== null ? s.noAbsen : ''}\n`;
    });

    const filename = `Data_Siswa_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Ekspor siswa error:', error);
    return NextResponse.json({ message: 'Gagal mengekspor data siswa' }, { status: 500 });
  }
}
