import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ kelasId?: string; bulan?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function RekapAbsensiPrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { kelasId, bulan } = params;

  if (!kelasId || !bulan) {
    return notFound();
  }

  // Parse bulan (YYYY-MM)
  const [yearStr, monthStr] = bulan.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed in JS Date

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: { tahunAjaran: true },
  });

  if (!kelas) {
    return notFound();
  }

  const siswaList = await prisma.siswa.findMany({
    where: { kelasId },
    orderBy: [
      { noAbsen: 'asc' },
      { nama: 'asc' }
    ],
  });

  // Fetch School Profile
  const profil = await prisma.profilSekolah.findFirst();

  // Ambil semua absensi siswa kelas ini pada bulan tersebut
  const absensiRecords = await prisma.absensi.findMany({
    where: {
      siswa: { kelasId },
      tanggal: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Hitung jumlah hari efektif belajar (jumlah hari di mana ada minimal satu siswa diabsen)
  const uniqueDates = Array.from(new Set(absensiRecords.map((r) => r.tanggal.toISOString().split('T')[0])));
  
  // Hitung default hari kerja (Senin-Sabtu) untuk bulan ini jika belum ada data absensi
  let defaultHariEfektif = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() !== 0) { // Bukan hari Minggu (0)
      defaultHariEfektif++;
    }
  }
  const totalHariEfektif = uniqueDates.length || defaultHariEfektif;

  const rows = siswaList.map((siswa, index) => {
    const siswaAbsensi = absensiRecords.filter((r) => r.siswaId === siswa.id);
    const hadir = siswaAbsensi.filter((r) => r.status === 'HADIR').length;
    const izin = siswaAbsensi.filter((r) => r.status === 'IZIN').length;
    const sakit = siswaAbsensi.filter((r) => r.status === 'SAKIT').length;
    const alpa = siswaAbsensi.filter((r) => r.status === 'ALPA').length;
    const total = siswaAbsensi.length;
    
    // Asumsikan total hari kerja adalah totalHariEfektif
    const persentase = totalHariEfektif > 0 
      ? Math.round((hadir / totalHariEfektif) * 100) 
      : 0;

    return {
      no: index + 1,
      nisn: siswa.nisn,
      nama: siswa.nama,
      hadir,
      izin,
      sakit,
      alpa,
      total,
      persentase,
    };
  });

  const namaBulan = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const tanggalLaporan = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Hitung jumlah hari dalam bulan tersebut
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 w-full font-sans relative">
      {/* Tombol Cetak Manual */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Laporan
          </button>
        `}}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        @page {
          size: A4 landscape;
          margin: 1cm;
        }
      `}} />

      {/* Kop Laporan */}
      <div className="border-b-2 border-black pb-3 text-center relative flex items-center justify-center min-h-[70px]">
        {isValidImageUrl(profil?.logoPemdaUrl) && (
          <img 
            src={profil!.logoPemdaUrl!} 
            alt="Logo Pemda" 
            className="w-14 h-14 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        {isValidImageUrl(profil?.logoSekolahUrl) && (
          <img 
            src={profil!.logoSekolahUrl!} 
            alt="Logo Sekolah" 
            className="w-14 h-14 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        <div className={`flex-1 text-center ${isValidImageUrl(profil?.logoPemdaUrl) ? 'pl-16' : ''} ${isValidImageUrl(profil?.logoSekolahUrl) ? 'pr-16' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider leading-none">
            {profil?.pemerintah || 'Pemerintah Kabupaten Pati'}
          </h2>
          <h2 className="text-xs font-bold uppercase tracking-wider leading-none mt-1">
            {profil?.dinas || 'Dinas Pendidikan dan Kebudayaan'}
          </h2>
          <h1 className="text-base font-black uppercase tracking-wide leading-tight mt-1">
            {profil?.namaSekolah || 'SD Negeri Wedusan'}
          </h1>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">
            Laporan Rekapitulasi Absensi Bulanan • Kelas: {kelas.nama} • Periode: {namaBulan} • TA: {kelas.tahunAjaran.tahun}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[10px] text-slate-650">
        <p>Total Hari Efektif KBM: <strong>{totalHariEfektif} Hari</strong></p>
        <p>Dicetak: {tanggalLaporan}</p>
      </div>

      {/* Tabel Data Rekap Harian */}
      <table className="w-full mt-3 border-collapse border border-black text-left table-fixed">
        <thead>
          <tr className="bg-slate-100 border-b border-black text-[9px]">
            <th className="p-1 border-r border-black font-bold text-center w-8" rowSpan={2}>No</th>
            <th className="p-1 border-r border-black font-bold w-20" rowSpan={2}>NISN</th>
            <th className="p-1 border-r border-black font-bold w-40" rowSpan={2}>Nama Siswa</th>
            <th className="border-r border-black font-bold text-center" colSpan={daysInMonth}>Tanggal</th>
            <th className="border-r border-black font-bold text-center w-28" colSpan={4}>Rekap</th>
            <th className="font-bold text-right w-12" rowSpan={2}>%</th>
          </tr>
          <tr className="bg-slate-100 border-b border-black text-[8px]">
            {dayNumbers.map((d) => (
              <th key={d} className="p-0.5 border-r border-black text-center font-semibold w-6">{d}</th>
            ))}
            <th className="p-0.5 border-r border-black text-center bg-emerald-50 text-emerald-800 font-bold w-7">H</th>
            <th className="p-0.5 border-r border-black text-center bg-sky-50 text-sky-800 font-bold w-7">I</th>
            <th className="p-0.5 border-r border-black text-center bg-amber-50 text-amber-800 font-bold w-7">S</th>
            <th className="p-0.5 border-r border-black text-center bg-rose-50 text-rose-800 font-bold w-7">A</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/40">
          {siswaList.map((siswa, index) => {
            const studentAbsensi = absensiRecords.filter((r) => r.siswaId === siswa.id);
            const hadir = studentAbsensi.filter((r) => r.status === 'HADIR').length;
            const izin = studentAbsensi.filter((r) => r.status === 'IZIN').length;
            const sakit = studentAbsensi.filter((r) => r.status === 'SAKIT').length;
            const alpa = studentAbsensi.filter((r) => r.status === 'ALPA').length;
            
            const persentase = totalHariEfektif > 0 
              ? Math.round((hadir / totalHariEfektif) * 100) 
              : 0;

            return (
              <tr key={siswa.id} className="border-b border-black/40 text-[9px] hover:bg-slate-50">
                <td className="p-1 border-r border-black text-center">{index + 1}</td>
                <td className="p-1 border-r border-black font-mono text-[8px]">{siswa.nisn}</td>
                <td className="p-1 border-r border-black font-semibold truncate" title={siswa.nama}>{siswa.nama}</td>
                {dayNumbers.map((d) => {
                  // Bandingkan tanggal secara timezone-safe
                  const record = studentAbsensi.find((r) => {
                    const rDate = new Date(r.tanggal);
                    return rDate.getDate() === d && 
                           rDate.getMonth() === month && 
                           rDate.getFullYear() === year;
                  });
                  
                  let statusChar = '-';
                  let statusClass = 'text-slate-400';
                  if (record) {
                    if (record.status === 'HADIR') {
                      statusChar = '•'; // Titik kecil agar bersih khas sekolah
                      statusClass = 'text-emerald-600 font-bold text-[11px]';
                    } else if (record.status === 'IZIN') {
                      statusChar = 'I';
                      statusClass = 'text-sky-600 font-bold';
                    } else if (record.status === 'SAKIT') {
                      statusChar = 'S';
                      statusClass = 'text-amber-600 font-bold';
                    } else if (record.status === 'ALPA') {
                      statusChar = 'A';
                      statusClass = 'text-rose-600 font-black';
                    }
                  }
                  
                  return (
                    <td key={d} className={`p-0.5 border-r border-black text-center font-mono ${statusClass}`}>
                      {statusChar}
                    </td>
                  );
                })}
                <td className="p-1 border-r border-black text-center bg-emerald-50/20 font-bold">{hadir}</td>
                <td className="p-1 border-r border-black text-center bg-sky-50/20">{izin}</td>
                <td className="p-1 border-r border-black text-center bg-amber-50/20">{sakit}</td>
                <td className="p-1 border-r border-black text-center bg-rose-50/20 font-bold text-rose-600">{alpa}</td>
                <td className="p-1 text-right font-bold bg-slate-50/50">{persentase}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legenda Singkatan */}
      <div className="mt-3 text-[9px] text-slate-500 space-x-4">
        <span>* Keterangan:</span>
        <span><strong>• (H)</strong>: Hadir</span>
        <span><strong>I</strong>: Izin</span>
        <span><strong>S</strong>: Sakit</span>
        <span><strong>A</strong>: Alpa (Tanpa Keterangan)</span>
      </div>

      {/* Kolom Tanda Tangan */}
      <div className="mt-8 grid grid-cols-2 text-center text-xs gap-8">
        <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-14" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500">NIP. {profil.nipKepsek}</p>
          )}
        </div>
        <div>
          <p>{profil?.namaSekolah.split(' ')[2] || 'Wedusan'}, {tanggalLaporan}</p>
          <p>Guru BK / Wali Kelas</p>
          <div className="h-14" />
          <p className="font-bold underline">Budi Santoso, S.Pd.</p>
          <p className="text-[10px] text-slate-500">NIP. 198503152010011002</p>
        </div>
      </div>

      {/* Script Auto Print */}
      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(() => {
          window.print();
        }, 500);
      `}} />
    </div>
  );
}
