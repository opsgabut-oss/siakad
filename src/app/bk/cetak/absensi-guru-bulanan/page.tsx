import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ guruId?: string; bulan?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

const getLastWorkingDayOfMonth = (bulanStr: string) => {
  if (!bulanStr) {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const [year, month] = bulanStr.split('-').map(Number);
  let date = new Date(year, month, 0);
  
  const day = date.getDay();
  if (day === 0) { // Sunday -> Saturday
    date.setDate(date.getDate() - 1);
  }
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default async function MonthlyTeacherAttendancePrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { guruId, bulan } = params;

  if (!guruId || !bulan) {
    return notFound();
  }

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  // Ambil data guru
  const guru = await prisma.guru.findUnique({
    where: { id: guruId }
  });

  if (!guru) {
    return notFound();
  }

  // Parse bulan (YYYY-MM)
  const [yearStr, monthStr] = bulan.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed in JS Date

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  // Ambil data absensi guru pada range bulan ini
  const absensiRecords = await prisma.absensiGuru.findMany({
    where: {
      guruId,
      tanggal: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const formatWaktu = (dateObj: Date | null) => {
    if (!dateObj) return '-';
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Jumlah hari dalam bulan tersebut
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const dayName = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const isWeekend = currentDate.getDay() === 0;

    // Cari record untuk tanggal ini secara timezone-safe
    const record = absensiRecords.find((r) => {
      const rDate = new Date(r.tanggal);
      return rDate.getDate() === d && 
             rDate.getMonth() === month && 
             rDate.getFullYear() === year;
    });

    let status = '-';
    if (record) {
      status = record.status;
    } else if (!isWeekend) {
      status = 'ALPA';
    }

    rows.push({
      tanggal: d,
      hari: dayName,
      isWeekend,
      status,
      waktuDatang: record?.waktuDatang ? new Date(record.waktuDatang) : null,
      waktuPulang: record?.waktuPulang ? new Date(record.waktuPulang) : null,
      ttdDatang: record?.ttdDatang || null,
      ttdPulang: record?.ttdPulang || null,
      keterangan: record?.keterangan || '-'
    });
  }

  // Hitung ringkasan kehadiran
  const totalHadir = absensiRecords.filter(r => r.status === 'HADIR').length;
  const totalIzin = absensiRecords.filter(r => r.status === 'IZIN').length;
  const totalSakit = absensiRecords.filter(r => r.status === 'SAKIT').length;
  
  // Total hari kerja (Senin-Jumat)
  let totalHariKerja = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    if (currentDate.getDay() !== 0) {
      totalHariKerja++;
    }
  }
  const totalAlpa = Math.max(0, totalHariKerja - (totalHadir + totalIzin + totalSakit));

  const namaBulan = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const tanggalLaporan = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 w-full font-sans relative">
      {/* Tombol Cetak Manual */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors">
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
          size: A4 portrait;
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
            Kartu Rekapitulasi Absensi Bulanan Pendidik & Staf
          </p>
        </div>
      </div>

      {/* Detail Guru */}
      <div className="mt-4 grid grid-cols-2 text-xs gap-4 border border-black p-3 bg-slate-50">
        <div className="space-y-1">
          <p>Nama Lengkap: <strong>{guru.nama}</strong></p>
          {guru.nip && (
            <p>NIP: <strong>{guru.nip}</strong></p>
          )}
          <p>Pangkat/Golongan: <strong>{guru.pangkat || '-'} {guru.golongan ? `(${guru.golongan})` : ''}</strong></p>
        </div>
        <div className="space-y-1 text-right">
          <p>Periode Bulan: <strong>{namaBulan}</strong></p>
          <p>Total Hari Kerja: <strong>{totalHariKerja} Hari</strong></p>
          <p>Kehadiran: <strong>H: {totalHadir} | I: {totalIzin} | S: {totalSakit} | A: {totalAlpa}</strong></p>
        </div>
      </div>

      {/* Tabel Absensi */}
      <table className="w-full mt-3 border-collapse border border-black text-left">
        <thead>
          <tr className="bg-slate-100 border-b border-black text-[9px] uppercase font-bold">
            <th className="p-1 border-r border-black text-center w-8">Tgl</th>
            <th className="p-1 border-r border-black w-24">Hari</th>
            <th className="p-1 border-r border-black text-center w-16">Status</th>
            <th className="p-1 border-r border-black text-center w-16">Jam Datang</th>
            <th className="p-1 border-r border-black text-center w-36">Tanda Tangan Datang</th>
            <th className="p-1 border-r border-black text-center w-16">Jam Pulang</th>
            <th className="p-1 border-r border-black text-center w-36">Tanda Tangan Pulang</th>
            <th className="p-1 w-28">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/40">
          {rows.map((row) => (
            <tr key={row.tanggal} className={`border-b border-black/40 text-[9px] h-10 ${row.isWeekend ? 'bg-slate-50' : ''}`}>
              <td className="p-1 border-r border-black text-center font-bold">{row.tanggal}</td>
              <td className="p-1 border-r border-black">{row.hari}</td>
              <td className="p-1 border-r border-black text-center font-bold">
                <span className={
                  row.status === 'HADIR' ? 'text-emerald-700' :
                  row.status === 'SAKIT' ? 'text-amber-700' :
                  row.status === 'IZIN' ? 'text-sky-700' :
                  row.status === 'ALPA' ? 'text-rose-700' : 'text-slate-400'
                }>{row.status}</span>
              </td>
              <td className="p-1 border-r border-black text-center">{formatWaktu(row.waktuDatang)}</td>
              <td className="p-0.5 border-r border-black text-center vertical-align-middle">
                {row.ttdDatang ? (
                  <div className="bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[120px] h-8 mx-auto flex items-center justify-center">
                    <img src={row.ttdDatang} alt="Ttd Datang" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-slate-300 text-[8px]">{row.isWeekend ? '-' : ''}</div>
                )}
              </td>
              <td className="p-1 border-r border-black text-center">{formatWaktu(row.waktuPulang)}</td>
              <td className="p-0.5 border-r border-black text-center vertical-align-middle">
                {row.ttdPulang ? (
                  <div className="bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[120px] h-8 mx-auto flex items-center justify-center">
                    <img src={row.ttdPulang} alt="Ttd Pulang" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-slate-300 text-[8px]">{row.isWeekend ? '-' : ''}</div>
                )}
              </td>
              <td className="p-1 truncate max-w-[100px]" title={row.keterangan}>{row.keterangan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Kolom Tanda Tangan */}
      <div className="mt-8 grid grid-cols-2 text-center text-xs gap-8">
        <div>
          <p>Guru / Staf Pendidik,</p>
          <div className="h-16" />
          <p className="font-bold underline">{guru.nama}</p>
          {(guru.nip || guru.nik) && (
            <p className="text-[10px] text-slate-500">NIP/NIK. {guru.nip || guru.nik}</p>
          )}
        </div>
        <div>
          <p>{profil?.namaSekolah?.split(' ')[2] || 'Wedusan'}, {getLastWorkingDayOfMonth(bulan)}</p>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500">NIP. {profil.nipKepsek}</p>
          )}
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
