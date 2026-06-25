import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ kelasId?: string; mapelId?: string; semester?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function CetakPromesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { kelasId, mapelId, semester: semesterStr } = params;

  if (!kelasId || !mapelId) {
    return notFound();
  }

  const semester = parseInt(semesterStr || '1', 10);

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  const hasPemdaLogo = isValidImageUrl(profil?.logoPemdaUrl);
  const hasSekolahLogo = isValidImageUrl(profil?.logoSekolahUrl);
  const leftLogoUrl = hasPemdaLogo ? profil?.logoPemdaUrl : (hasSekolahLogo ? profil?.logoSekolahUrl : null);
  const rightLogoUrl = (hasPemdaLogo && hasSekolahLogo) ? profil?.logoSekolahUrl : null;

  // Ambil data kelas
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: { tahunAjaran: true, waliKelas: true }
  });

  // Ambil data mapel
  const mapel = await prisma.mataPelajaran.findUnique({
    where: { id: mapelId }
  });

  if (!kelas || !mapel) {
    return notFound();
  }

  // Ambil list TP untuk mapel & semester ini
  const tps = await prisma.tujuanPembelajaran.findMany({
    where: {
      mataPelajaranId: mapelId,
      semester,
    },
    orderBy: { createdAt: 'asc' }
  });

  // Ambil pemetaan Promes
  const promesRecords = await prisma.promesMinggu.findMany({
    where: {
      tujuanPembelajaranId: { in: tps.map(tp => tp.id) }
    }
  });

  const bulanList = semester === 1 
    ? [
        { id: 7, nama: 'Juli' },
        { id: 8, nama: 'Agustus' },
        { id: 9, nama: 'September' },
        { id: 10, nama: 'Oktober' },
        { id: 11, nama: 'November' },
        { id: 12, nama: 'Desember' }
      ]
    : [
        { id: 1, nama: 'Januari' },
        { id: 2, nama: 'Februari' },
        { id: 3, nama: 'Maret' },
        { id: 4, nama: 'April' },
        { id: 5, nama: 'Mei' },
        { id: 6, nama: 'Juni' }
      ];

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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Promes
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
        .text-justify-custom {
          text-align: justify;
          text-justify: inter-word;
        }
      `}} />

      {/* Kop Laporan */}
      <div className="border-b-2 border-black pb-3 text-center relative flex items-center justify-center min-h-[70px]">
        {leftLogoUrl && (
          <img 
            src={leftLogoUrl} 
            alt="Logo" 
            className="w-14 h-14 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        {rightLogoUrl && (
          <img 
            src={rightLogoUrl} 
            alt="Logo" 
            className="w-14 h-14 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        <div className={`flex-1 text-center ${leftLogoUrl ? 'pl-16' : ''} ${rightLogoUrl ? 'pr-16' : ''}`}>
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
            {profil?.alamat || 'Jl. Puncel - Ngablak KM. 05 Desa Wedusan, Kec. Dukuhseti, Kab. Pati (59158)'}
          </p>
        </div>
      </div>

      <div className="text-center mt-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">PROGRAM SEMESTER (PROMES)</h2>
        <h3 className="text-xs font-semibold uppercase mt-1">
          SEMESTER {semester === 1 ? 'I (GANJIL)' : 'II (GENAP)'} • TAHUN AJARAN {kelas.tahunAjaran.tahun}
        </h3>
      </div>

      {/* Meta Info */}
      <div className="mt-4 flex justify-between text-[10px]">
        <div className="space-y-1">
          <p>Mata Pelajaran: <strong>{mapel.nama}</strong></p>
          <p>Kelas: <strong>{kelas.nama}</strong></p>
        </div>
        <div className="space-y-1 text-right">
          <p>Satuan Pendidikan: <strong>{profil?.namaSekolah || 'SD Negeri Wedusan'}</strong></p>
          <p>Tahun Pelajaran: <strong>{kelas.tahunAjaran.tahun}</strong></p>
        </div>
      </div>

      {/* Grid Table Promes */}
      <table className="w-full mt-4 border-collapse border border-black text-left text-[9px] table-fixed">
        <thead>
          <tr className="bg-slate-100 border-b border-black text-center font-bold">
            <th className="p-1.5 border-r border-black w-8" rowSpan={2}>No</th>
            <th className="p-1.5 border-r border-black w-72" rowSpan={2}>Tujuan Pembelajaran (TP)</th>
            <th className="p-1.5 border-r border-black w-14 text-center" rowSpan={2}>Jml JP</th>
            <th className="p-1.5 border-r border-black w-12 text-center" rowSpan={2}>KKTP</th>
            {bulanList.map(b => (
              <th key={b.id} className="p-1 border-r border-black text-center" colSpan={5}>{b.nama}</th>
            ))}
          </tr>
          <tr className="bg-slate-50 border-b border-black text-center font-bold text-[8px]">
            {bulanList.map(b => 
              Array.from({ length: 5 }, (_, idx) => (
                <th key={`${b.id}-${idx}`} className="p-0.5 border-r border-black w-5">{idx + 1}</th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {tps.length === 0 ? (
            <tr>
              <td className="p-4 text-center italic text-slate-400" colSpan={34}>
                Belum ada data Tujuan Pembelajaran untuk semester ini.
              </td>
            </tr>
          ) : (
            tps.map((tp, idx) => (
              <tr key={tp.id} className="border-b border-black/45 h-8">
                <td className="p-1 border-r border-black text-center font-bold">{idx + 1}</td>
                <td className="p-1 border-r border-black text-justify-custom font-medium leading-tight">{tp.deskripsi}</td>
                <td className="p-1 border-r border-black text-center font-semibold">{tp.alokasiJP} JP</td>
                <td className="p-1 border-r border-black text-center font-bold">{tp.kktp}</td>
                {bulanList.map(b => 
                  Array.from({ length: 5 }, (_, idx) => {
                    const isChecked = promesRecords.some(
                      r => r.tujuanPembelajaranId === tp.id && r.bulan === b.id && r.mingguKe === (idx + 1)
                    );
                    return (
                      <td 
                        key={`${b.id}-${idx}`} 
                        className={`border-r border-black/40 ${isChecked ? 'bg-slate-600 print:bg-slate-300' : ''}`}
                      />
                    );
                  })
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Kolom Tanda Tangan */}
      <div className="mt-10 grid grid-cols-2 text-center text-xs gap-8">
        <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-14" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {profil.nipKepsek}</p>
          )}
        </div>
        <div>
          <p>{profil?.namaSekolah?.split(' ')[2] || 'Wedusan'}, {tanggalCetakStr}</p>
          <p>Guru Kelas,</p>
          <div className="h-14" />
          <p className="font-bold underline">{kelas.waliKelas?.nama || 'Budiono, S.Pd.'}</p>
          {kelas.waliKelas?.nip && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {kelas.waliKelas.nip}</p>
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
