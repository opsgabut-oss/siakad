import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ tanggal?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function DailyTeacherAttendancePrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { tanggal } = params;

  // Gunakan tanggal parameter atau hari ini (Asia/Jakarta)
  const targetTanggalStr = tanggal || new Intl.DateTimeFormat('sv', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const targetDate = new Date(targetTanggalStr);

  if (isNaN(targetDate.getTime())) {
    return notFound();
  }

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  // Ambil data guru
  const gurus = await prisma.guru.findMany({
    orderBy: [
      { noAbsen: 'asc' },
      { nama: 'asc' }
    ]
  });

  // Ambil absensi hari tersebut
  const absensiRecords = await prisma.absensiGuru.findMany({
    where: {
      tanggal: targetDate
    }
  });

  const formatWaktu = (dateObj: Date | null) => {
    if (!dateObj) return '-';
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const rows = gurus.map((guru, index) => {
    const record = absensiRecords.find(r => r.guruId === guru.id);
    return {
      no: index + 1,
      nama: guru.nama,
      nip: guru.nip || '-',
      nik: guru.nik || '-',
      pangkat: guru.pangkat || '-',
      golongan: guru.golongan || '-',
      status: record?.status || 'ALPA',
      waktuDatang: record?.waktuDatang ? new Date(record.waktuDatang) : null,
      waktuPulang: record?.waktuPulang ? new Date(record.waktuPulang) : null,
      ttdDatang: record?.ttdDatang || null,
      ttdPulang: record?.ttdPulang || null,
      keterangan: record?.keterangan || '-'
    };
  });

  const tanggalLaporan = targetDate.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const tanggalCetakStr = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

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
            Laporan Kehadiran Harian Pendidik & Staf
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-xs">
        <p>Hari/Tanggal: <strong>{tanggalLaporan}</strong></p>
        <p>Dicetak: {tanggalCetakStr}</p>
      </div>

      {/* Tabel Absensi */}
      <table className="w-full mt-3 border-collapse border border-black text-left">
        <thead>
          <tr className="bg-slate-100 border-b border-black text-[10px] uppercase font-bold">
            <th className="p-2 border-r border-black text-center w-8">No</th>
            <th className="p-2 border-r border-black w-64">Nama Guru / Staf</th>
            <th className="p-2 border-r border-black w-36">Pangkat / Golongan</th>
            <th className="p-2 border-r border-black text-center w-16">Status</th>
            <th className="p-2 border-r border-black text-center w-16">Datang</th>
            <th className="p-2 border-r border-black text-center w-28">Tanda Tangan Datang</th>
            <th className="p-2 border-r border-black text-center w-16">Pulang</th>
            <th className="p-2 border-r border-black text-center w-28">Tanda Tangan Pulang</th>
            <th className="p-2 w-32">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/40">
          {rows.map((row) => (
            <tr key={row.no} className="border-b border-black/40 text-[10px] h-12">
              <td className="p-2 border-r border-black text-center">{row.no}</td>
              <td className="p-2 border-r border-black font-semibold">
                <div>{row.nama}</div>
                {row.nip && row.nip !== '-' && (
                  <div className="text-[9px] text-slate-500 font-mono font-normal mt-0.5">NIP. {row.nip}</div>
                )}
              </td>
              <td className="p-2 border-r border-black">
                {row.pangkat !== '-' || row.golongan !== '-' ? (
                  <span>
                    {row.pangkat !== '-' ? row.pangkat : '-'} {row.golongan !== '-' ? `(${row.golongan})` : ''}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">-</span>
                )}
              </td>
              <td className="p-2 border-r border-black text-center font-bold">
                <span className={
                  row.status === 'HADIR' ? 'text-emerald-700' :
                  row.status === 'SAKIT' ? 'text-amber-700' :
                  row.status === 'IZIN' ? 'text-sky-700' : 'text-rose-700'
                }>{row.status}</span>
              </td>
              <td className="p-2 border-r border-black text-center font-semibold">{formatWaktu(row.waktuDatang)}</td>
              <td className="p-1 border-r border-black text-center vertical-align-middle">
                {row.ttdDatang ? (
                  <div className="bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[100px] h-9 mx-auto flex items-center justify-center">
                    <img src={row.ttdDatang} alt="Ttd Datang" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-slate-350 text-[8px] italic">-</div>
                )}
              </td>
              <td className="p-2 border-r border-black text-center font-semibold">{formatWaktu(row.waktuPulang)}</td>
              <td className="p-1 border-r border-black text-center vertical-align-middle">
                {row.ttdPulang ? (
                  <div className="bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[100px] h-9 mx-auto flex items-center justify-center">
                    <img src={row.ttdPulang} alt="Ttd Pulang" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-slate-350 text-[8px] italic">-</div>
                )}
              </td>
              <td className="p-2 truncate max-w-[120px]" title={row.keterangan}>{row.keterangan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Kolom Tanda Tangan */}
      <div className="mt-8 grid grid-cols-3 text-center text-xs">
        <div className="col-span-2"></div>
        <div>
          <p>{profil?.namaSekolah?.split(' ')[2] || 'Wedusan'}, {tanggalCetakStr}</p>
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
